'use client';

import { useCallback } from 'react';
import {
	ReactFlow,
	Background,
	Controls,
	type Node,
	type Edge,
	Position,
	MarkerType,
	BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const baseNodeStyle = {
	padding: '10px 16px',
	borderRadius: 8,
	fontSize: 12,
	fontWeight: 600,
	textAlign: 'center' as const,
	border: '2px solid',
	minWidth: 130,
};

const groupLabelStyle = {
	fontSize: 11,
	fontWeight: 700,
	letterSpacing: '0.05em',
	textTransform: 'uppercase' as const,
	padding: '6px 14px',
	borderRadius: 6,
	border: '2px dashed',
};

const nodes: Node[] = [
	// ── Group Labels ──
	{
		id: 'group-clients', type: 'default', position: { x: 20, y: 0 },
		data: { label: 'Clients' },
		style: { ...groupLabelStyle, borderColor: '#7c3aed', color: '#7c3aed', backgroundColor: '#faf5ff' },
		selectable: false, draggable: false,
	},
	{
		id: 'group-api', type: 'default', position: { x: 260, y: 0 },
		data: { label: 'API & Orchestration' },
		style: { ...groupLabelStyle, borderColor: '#2563eb', color: '#2563eb', backgroundColor: '#eff6ff' },
		selectable: false, draggable: false,
	},
	{
		id: 'group-compute', type: 'default', position: { x: 530, y: 0 },
		data: { label: 'Compute' },
		style: { ...groupLabelStyle, borderColor: '#059669', color: '#059669', backgroundColor: '#ecfdf5' },
		selectable: false, draggable: false,
	},
	{
		id: 'group-data', type: 'default', position: { x: 790, y: 0 },
		data: { label: 'Data & Storage' },
		style: { ...groupLabelStyle, borderColor: '#d97706', color: '#d97706', backgroundColor: '#fffbeb' },
		selectable: false, draggable: false,
	},

	// ── Client tier ──
	{
		id: 'wizard', position: { x: 15, y: 70 },
		data: { label: 'Ingest Wizard\n4-Step Upload' },
		style: { ...baseNodeStyle, borderColor: '#7c3aed', backgroundColor: '#ede9fe', color: '#3b1f7e', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'catalog-ui', position: { x: 15, y: 180 },
		data: { label: 'Data Catalog\nSearch & Browse' },
		style: { ...baseNodeStyle, borderColor: '#7c3aed', backgroundColor: '#ede9fe', color: '#3b1f7e', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'obfuscation-ui', position: { x: 15, y: 290 },
		data: { label: 'Obfuscation Service\nJob Management' },
		style: { ...baseNodeStyle, borderColor: '#7c3aed', backgroundColor: '#ede9fe', color: '#3b1f7e', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},

	// ── API tier ──
	{
		id: 'apigw', position: { x: 250, y: 70 },
		data: { label: 'API Gateway\nREST Endpoints' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'anthropic', position: { x: 250, y: 180 },
		data: { label: 'Anthropic Claude\nMetadata + Chat' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'kms', position: { x: 250, y: 290 },
		data: { label: 'KMS CMK\nSeed Management' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},

	// ── Compute tier ──
	{
		id: 'lambda-quality', position: { x: 520, y: 70 },
		data: { label: 'Lambda\nQuality Check' },
		style: { ...baseNodeStyle, borderColor: '#059669', backgroundColor: '#d1fae5', color: '#064e3b', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'lambda-metadata', position: { x: 520, y: 180 },
		data: { label: 'Lambda\nMetadata Gen' },
		style: { ...baseNodeStyle, borderColor: '#059669', backgroundColor: '#d1fae5', color: '#064e3b', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'lambda-obfuscate', position: { x: 520, y: 290 },
		data: { label: 'Lambda\nHMAC Obfuscation' },
		style: { ...baseNodeStyle, borderColor: '#059669', backgroundColor: '#d1fae5', color: '#064e3b', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'lambda-chat', position: { x: 520, y: 390 },
		data: { label: 'Lambda\nCatalog Chat' },
		style: { ...baseNodeStyle, borderColor: '#059669', backgroundColor: '#d1fae5', color: '#064e3b', whiteSpace: 'pre-line' },
		sourcePosition: Position.Top, targetPosition: Position.Left,
	},

	// ── Data tier ──
	{
		id: 'dynamo', position: { x: 780, y: 70 },
		data: { label: 'DynamoDB\nCatalog + Jobs' },
		style: { ...baseNodeStyle, borderColor: '#d97706', backgroundColor: '#fef3c7', color: '#78350f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
	{
		id: 's3', position: { x: 780, y: 180 },
		data: { label: 'S3\nDataset Storage' },
		style: { ...baseNodeStyle, borderColor: '#d97706', backgroundColor: '#fef3c7', color: '#78350f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
	{
		id: 'cloudwatch', position: { x: 780, y: 290 },
		data: { label: 'CloudWatch\nAudit & Metrics' },
		style: { ...baseNodeStyle, borderColor: '#d97706', backgroundColor: '#fef3c7', color: '#78350f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
];

const edgeDefaults = {
	style: { strokeWidth: 2 },
	markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

const edges: Edge[] = [
	// Client → API
	{ id: 'wizard-apigw', source: 'wizard', target: 'apigw', label: 'Upload', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#7c3aed' }, animated: true },
	{ id: 'catalog-apigw', source: 'catalog-ui', target: 'apigw', label: 'Query', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#7c3aed' } },
	{ id: 'obfuscation-kms', source: 'obfuscation-ui', target: 'kms', label: 'Seed', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#7c3aed' } },
	{ id: 'obfuscation-apigw', source: 'obfuscation-ui', target: 'apigw', label: 'Submit', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#7c3aed' } },
	// API → Compute
	{ id: 'apigw-quality', source: 'apigw', target: 'lambda-quality', label: 'Invoke', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' }, animated: true },
	{ id: 'apigw-metadata', source: 'apigw', target: 'lambda-metadata', label: 'Generate', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' } },
	{ id: 'apigw-obfuscate', source: 'apigw', target: 'lambda-obfuscate', label: 'HMAC', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' } },
	{ id: 'apigw-chat', source: 'apigw', target: 'lambda-chat', label: 'Chat', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb', strokeDasharray: '5 5' } },
	// LLM connections
	{ id: 'anthropic-metadata', source: 'anthropic', target: 'lambda-metadata', label: 'LLM', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#059669' }, animated: true },
	{ id: 'anthropic-chat', source: 'anthropic', target: 'lambda-chat', label: 'LLM', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#059669' } },
	{ id: 'anthropic-quality', source: 'anthropic', target: 'lambda-quality', label: 'Semantic', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#059669', strokeDasharray: '5 5' } },
	// KMS → Obfuscation
	{ id: 'kms-obfuscate', source: 'kms', target: 'lambda-obfuscate', label: 'Key', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb', strokeDasharray: '5 5' } },
	// Compute → Data
	{ id: 'quality-dynamo', source: 'lambda-quality', target: 'dynamo', label: 'Write', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#d97706' }, animated: true },
	{ id: 'metadata-dynamo', source: 'lambda-metadata', target: 'dynamo', label: 'Publish', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#d97706' } },
	{ id: 'obfuscate-s3', source: 'lambda-obfuscate', target: 's3', label: 'Store', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#d97706' }, animated: true },
	{ id: 'quality-cw', source: 'lambda-quality', target: 'cloudwatch', label: 'Metrics', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#d97706', strokeDasharray: '5 5' } },
	{ id: 'obfuscate-cw', source: 'lambda-obfuscate', target: 'cloudwatch', label: 'Audit', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#d97706', strokeDasharray: '5 5' } },
];

/**
 * Interactive AWS architecture diagram for DataOps Suite.
 */
export default function ArchitectureDiagram() {
	const onInit = useCallback(() => {}, []);

	return (
		<div style={{ width: '100%', height: 580, border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onInit={onInit}
				fitView
				fitViewOptions={{ padding: 0.15 }}
				minZoom={0.3}
				maxZoom={1.5}
				proOptions={{ hideAttribution: true }}
				nodesDraggable
				nodesConnectable={false}
				elementsSelectable={false}
			>
				<Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
				<Controls showInteractive={false} />
			</ReactFlow>
		</div>
	);
}
