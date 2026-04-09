'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { motion } from 'motion/react';

const TEAL = '#15E49E';
const ORANGE = '#FF9B3E';
const TEXT_MUTED = 'rgba(255, 255, 255, 0.7)';

const containerVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
};

interface TechCategory {
	category: string;
	skills: string[];
}

const categories: TechCategory[] = [
	{
		category: 'Cloud & Infrastructure',
		skills: [
			'AWS Lambda', 'EC2', 'S3', 'ECS', 'EKS', 'API Gateway',
			'CloudWatch', 'IAM', 'Kinesis', 'Redshift', 'DynamoDB',
			'CloudFormation', 'SNS', 'KMS'
		]
	},
	{
		category: 'AI / ML',
		skills: [
			'Claude LLM', 'RAG', 'Prompt Engineering', 'Active Learning',
			'Demand Forecasting', 'Anomaly Detection', 'ML Productionisation'
		]
	},
	{
		category: 'Data Engineering',
		skills: [
			'Apache Kafka', 'Apache Flink', 'Amazon Kinesis', 'MySQL',
			'PostgreSQL', 'ETL Pipelines', 'PII Tagging', 'Data Obfuscation',
			'Apache Spark', 'SQL'
		]
	},
	{
		category: 'Frontend & Web',
		skills: ['ReactJS', 'Node.js', 'TypeScript', 'R-Shiny']
	},
	{
		category: 'Languages',
		skills: ['Python', 'R']
	},
	{
		category: 'Compliance & Security',
		skills: [
			'GDPR', 'HIPAA', 'AWS KMS', 'Field-level Encryption',
			'Access Control', 'Penetration Testing', 'Audit Logging'
		]
	}
];

/**
 * Tech stack section — category cards with chip groups, SaaS App Dark style.
 */
function TechStackSection() {
	return (
		<Box
			id="tech"
			sx={{
				py: { xs: 8, md: 12 },
				px: 3,
				backgroundColor: '#000',
				borderTop: '1px solid rgba(255, 255, 255, 0.1)'
			}}
		>
			<Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
				<Typography
					sx={{
						fontFamily: "'Caveat', cursive",
						fontWeight: 700,
						fontSize: { xs: '22px', md: '28px' },
						color: ORANGE,
						mb: 2
					}}
				>
					Tools of the trade
				</Typography>
				<Typography
					sx={{
						fontFamily: "'Noto Serif KR', serif",
						fontWeight: 700,
						fontSize: { xs: '24px', md: '30px' },
						color: '#fff'
					}}
				>
					Technical Toolkit
				</Typography>
			</Box>

			<motion.div
				variants={containerVariants}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, amount: 0.1 }}
			>
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
						gap: '20px',
						maxWidth: 1200,
						mx: 'auto'
					}}
				>
					{categories.map((cat) => (
						<motion.div key={cat.category} variants={itemVariants}>
							<Box
								sx={{
									backgroundColor: 'rgba(255, 255, 255, 0.06)',
									borderRadius: '12px',
									p: '24px',
									transition: 'all 0.3s ease',
									'&:hover': {
										backgroundColor: 'rgba(255, 255, 255, 0.09)',
										transform: 'translateY(-3px)'
									}
								}}
							>
								<Typography
									sx={{
										color: TEAL,
										fontSize: '12px',
										fontWeight: 700,
										letterSpacing: '1.5px',
										textTransform: 'uppercase',
										mb: 2
									}}
								>
									{cat.category}
								</Typography>
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
									{cat.skills.map((skill) => (
										<Chip
											key={skill}
											label={skill}
											size="small"
											sx={{
												backgroundColor: 'rgba(255, 255, 255, 0.08)',
												color: TEXT_MUTED,
												fontSize: '12px',
												height: 26,
												border: 'none',
												transition: 'all 0.2s ease',
												'&:hover': {
													backgroundColor: `${TEAL}18`,
													color: TEAL
												}
											}}
										/>
									))}
								</Box>
							</Box>
						</motion.div>
					))}
				</Box>
			</motion.div>
		</Box>
	);
}

export default TechStackSection;
