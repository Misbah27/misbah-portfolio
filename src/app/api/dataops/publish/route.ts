import { NextResponse } from 'next/server';

interface PublishRequest {
	datasetId: string;
	datasetName: string;
	industryTag: string;
	sqlQuery: string;
	schema: {
		name: string;
		inferredType: string;
		nullable: boolean;
		piiType: string | null;
		examples: string[];
		description?: string;
	}[];
	rowCount: number;
	qualityScore: number;
	completeness: number;
	classification: string;
	piiColumns: { column: string; piiType: string; obfuscationRule: string }[];
	description: string;
	businessContext: string;
	lineage: { upstreamDatasets: string[]; transformationQuery: string | null; description: string };
	regulatoryFlags: string[];
	owner: string;
	tags: string[];
}

/**
 * POST /api/dataops/publish — Validate and build a catalog entry for publishing.
 * No filesystem writes — client persists to localStorage.
 */
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as PublishRequest;

		if (!body.datasetName || !body.industryTag || !body.datasetId) {
			return NextResponse.json(
				{ error: 'Missing required fields: datasetName, industryTag, datasetId' },
				{ status: 400 }
			);
		}

		const fileName = body.datasetName
			.toLowerCase()
			.replace(/[^a-z0-9_]/g, '_')
			.replace(/_+/g, '_');

		const newEntry = {
			datasetId: body.datasetId,
			name: body.datasetName,
			industryTag: body.industryTag,
			description: body.description,
			businessContext: body.businessContext,
			filePath: `data/dataops/datasets/${fileName}.json`,
			schema: body.schema.map((col) => ({
				name: col.name,
				inferredType: col.inferredType,
				nullable: col.nullable,
				piiType: col.piiType,
				sampleValues: col.examples || [],
				description: col.description || undefined,
			})),
			rowCount: body.rowCount,
			classification: body.classification,
			piiColumns: body.piiColumns,
			regulatoryFlags: body.regulatoryFlags.length > 0 ? body.regulatoryFlags : ['NONE'],
			owner: body.owner || 'data-platform-team',
			team: 'Data Engineering',
			domain: body.industryTag.toLowerCase().replace(/_/g, '-'),
			lastUpdated: new Date().toISOString().split('T')[0],
			tags: body.tags,
			lineage: body.lineage,
			statistics: {
				completeness: body.completeness,
				qualityScore: body.qualityScore,
			},
			publishedToCatalog: true,
		};

		return NextResponse.json({ success: true, entry: newEntry });
	} catch (error) {
		console.error('Publish error:', error);
		return NextResponse.json(
			{ error: 'Failed to publish dataset' },
			{ status: 500 }
		);
	}
}
