import * as cdk from 'aws-cdk-lib';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as route53 from 'aws-cdk-lib/aws-route53';
import type { Construct } from 'constructs';

/**
 * CDK stack for deploying the Misbah Portfolio on AWS Amplify.
 *
 * Prerequisites:
 * - GitHub personal access token stored in AWS Secrets Manager
 *   under the key "github-token" (used by GitHubSourceCodeProvider)
 * - Route53 hosted zone for the custom domain already exists
 *
 * After deployment, set the real ANTHROPIC_API_KEY value in the
 * Amplify Console → App settings → Environment variables.
 */
export class AmplifyStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// ── Amplify App ──────────────────────────────────────────────
		const app = new amplify.App(this, 'MisbahPortfolio', {
			appName: 'misbah-portfolio',
			sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
				owner: 'Misbah27',
				repository: 'misbah-portfolio',
				oauthToken: cdk.SecretValue.secretsManager('github-token'),
			}),
			buildSpec: cdk.aws_codebuild.BuildSpec.fromObjectToYaml({
				version: 1,
				frontend: {
					phases: {
						preBuild: { commands: ['npm ci'] },
						build: { commands: ['npm run build'] },
					},
					artifacts: {
						baseDirectory: '.next',
						files: ['**/*'],
					},
					cache: {
						paths: ['node_modules/**/*', '.next/cache/**/*'],
					},
				},
			}),
			platform: amplify.Platform.WEB_COMPUTE,
			environmentVariables: {
				ANTHROPIC_API_KEY: 'REPLACE_IN_AMPLIFY_CONSOLE',
				_CUSTOM_IMAGE: 'amplify:al2023',
				NODE_OPTIONS: '--max-old-space-size=4096',
			},
		});

		// ── Main branch (auto-build on push) ─────────────────────────
		const mainBranch = app.addBranch('main', {
			autoBuild: true,
			stage: 'PRODUCTION',
		});

		// ── Custom domain via Route53 ────────────────────────────────
		const hostedZone = route53.HostedZone.fromLookup(this, 'Zone', {
			domainName: 'misbah.engineer',
		});

		const domain = app.addDomain('CustomDomain', {
			domainName: 'misbah.engineer',
			enableAutoSubdomain: false,
		});

		domain.mapRoot(mainBranch);
		domain.mapSubDomain(mainBranch, 'www');

		// ── Outputs ──────────────────────────────────────────────────
		new cdk.CfnOutput(this, 'AmplifyAppId', {
			value: app.appId,
			description: 'Amplify Application ID',
		});

		new cdk.CfnOutput(this, 'AmplifyDefaultDomain', {
			value: `https://main.${app.defaultDomain}`,
			description: 'Amplify default domain URL',
		});

		new cdk.CfnOutput(this, 'CustomDomainUrl', {
			value: 'https://misbah.engineer',
			description: 'Custom domain URL (once DNS propagates)',
		});

		new cdk.CfnOutput(this, 'HostedZoneId', {
			value: hostedZone.hostedZoneId,
			description: 'Route53 Hosted Zone ID',
		});
	}
}
