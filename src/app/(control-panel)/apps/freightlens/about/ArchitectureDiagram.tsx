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
		style: { ...groupLabelStyle, borderColor: '#0d9488', color: '#0d9488', backgroundColor: '#f0fdfa' },
		selectable: false, draggable: false,
	},
	{
		id: 'group-api', type: 'default', position: { x: 275, y: 0 },
		data: { label: 'API Layer' },
		style: { ...groupLabelStyle, borderColor: '#2563eb', color: '#2563eb', backgroundColor: '#eff6ff' },
		selectable: false, draggable: false,
	},
	{
		id: 'group-compute', type: 'default', position: { x: 520, y: 0 },
		data: { label: 'Compute' },
		style: { ...groupLabelStyle, borderColor: '#f97316', color: '#f97316', backgroundColor: '#fff7ed' },
		selectable: false, draggable: false,
	},
	{
		id: 'group-data', type: 'default', position: { x: 770, y: 0 },
		data: { label: 'Data Layer' },
		style: { ...groupLabelStyle, borderColor: '#8b5cf6', color: '#8b5cf6', backgroundColor: '#f5f3ff' },
		selectable: false, draggable: false,
	},
	{
		id: 'group-ingest', type: 'default', position: { x: 275, y: 390 },
		data: { label: 'Ingestion Pipeline' },
		style: { ...groupLabelStyle, borderColor: '#ec4899', color: '#ec4899', backgroundColor: '#fdf2f8' },
		selectable: false, draggable: false,
	},

	// ── Client tier ──
	{
		id: 'ui', position: { x: 15, y: 70 },
		data: { label: 'React Dashboard\nRolling 21 / SA / Metrics' },
		style: { ...baseNodeStyle, borderColor: '#0d9488', backgroundColor: '#ccfbf1', color: '#134e4a', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'admin', position: { x: 15, y: 190 },
		data: { label: 'Admin Portal\nMetric Updates' },
		style: { ...baseNodeStyle, borderColor: '#0d9488', backgroundColor: '#ccfbf1', color: '#134e4a', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},

	// ── API tier ──
	{
		id: 'apigw', position: { x: 265, y: 70 },
		data: { label: 'API Gateway\nREST Endpoints' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'auth', position: { x: 265, y: 190 },
		data: { label: 'IAM + Cognito\nAuth Layer' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'anthropic', position: { x: 265, y: 290 },
		data: { label: 'Anthropic Claude\nLLM Analysis' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},

	// ── Compute tier ──
	{
		id: 'lambda-api', position: { x: 505, y: 70 },
		data: { label: 'Lambda\nQuery Handlers' },
		style: { ...baseNodeStyle, borderColor: '#f97316', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'lambda-write', position: { x: 505, y: 180 },
		data: { label: 'Lambda\nAdmin Write' },
		style: { ...baseNodeStyle, borderColor: '#f97316', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'lambda-llm', position: { x: 505, y: 290 },
		data: { label: 'Lambda\nLLM Orchestrator' },
		style: { ...baseNodeStyle, borderColor: '#f97316', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},

	// ── Data tier ──
	{
		id: 'dynamo', position: { x: 760, y: 80 },
		data: { label: 'DynamoDB\nRolling21 + Metrics' },
		style: { ...baseNodeStyle, borderColor: '#8b5cf6', backgroundColor: '#ede9fe', color: '#3b1f7e', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
	{
		id: 'cloudwatch', position: { x: 760, y: 200 },
		data: { label: 'CloudWatch\nAlarms & Dashboards' },
		style: { ...baseNodeStyle, borderColor: '#8b5cf6', backgroundColor: '#ede9fe', color: '#3b1f7e', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
	{
		id: 's3', position: { x: 760, y: 310 },
		data: { label: 'S3\nFC Data Drops' },
		style: { ...baseNodeStyle, borderColor: '#8b5cf6', backgroundColor: '#ede9fe', color: '#3b1f7e', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},

	// ── Ingestion pipeline ──
	{
		id: 'eventbridge', position: { x: 220, y: 460 },
		data: { label: 'EventBridge\nScheduled Triggers' },
		style: { ...baseNodeStyle, borderColor: '#ec4899', backgroundColor: '#fce7f3', color: '#831843', whiteSpace: 'pre-line', minWidth: 120 },
		sourcePosition: Position.Top, targetPosition: Position.Bottom,
	},
	{
		id: 'lambda-ingest', position: { x: 400, y: 460 },
		data: { label: 'Lambda\nConsolidation' },
		style: { ...baseNodeStyle, borderColor: '#ec4899', backgroundColor: '#fce7f3', color: '#831843', whiteSpace: 'pre-line', minWidth: 120 },
		sourcePosition: Position.Top, targetPosition: Position.Left,
	},
	{
		id: 'sns-alerts', position: { x: 580, y: 460 },
		data: { label: 'SNS\nFreshness Alerts' },
		style: { ...baseNodeStyle, borderColor: '#ec4899', backgroundColor: '#fce7f3', color: '#831843', whiteSpace: 'pre-line', minWidth: 120 },
		sourcePosition: Position.Top, targetPosition: Position.Left,
	},
];

const edgeDefaults = {
	style: { strokeWidth: 2 },
	markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

const edges: Edge[] = [
	// Client → API
	{ id: 'ui-apigw', source: 'ui', target: 'apigw', label: 'REST', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#0d9488' }, animated: true },
	{ id: 'admin-apigw', source: 'admin', target: 'apigw', label: 'POST', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#0d9488' } },
	// Auth
	{ id: 'apigw-auth', source: 'apigw', target: 'auth', label: 'Validate', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' } },
	// API → Compute
	{ id: 'apigw-lambda-api', source: 'apigw', target: 'lambda-api', label: 'Invoke', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#f97316' }, animated: true },
	{ id: 'apigw-lambda-write', source: 'apigw', target: 'lambda-write', label: 'Write', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#f97316' } },
	{ id: 'anthropic-lambda-llm', source: 'anthropic', target: 'lambda-llm', label: 'LLM', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#f97316' } },
	// Compute → Data
	{ id: 'lambda-api-dynamo', source: 'lambda-api', target: 'dynamo', label: 'Query', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#8b5cf6' }, animated: true },
	{ id: 'lambda-write-dynamo', source: 'lambda-write', target: 'dynamo', label: 'Upsert', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#8b5cf6' } },
	{ id: 'lambda-api-cw', source: 'lambda-api', target: 'cloudwatch', label: 'Metrics', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#8b5cf6', strokeDasharray: '5 5' } },
	// Ingestion
	{ id: 'eb-ingest', source: 'eventbridge', target: 'lambda-ingest', label: 'Trigger', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ec4899' }, animated: true },
	{ id: 's3-ingest', source: 's3', target: 'lambda-ingest', label: 'S3 Event', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ec4899' } },
	{ id: 'ingest-dynamo', source: 'lambda-ingest', target: 'dynamo', label: 'Write', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#8b5cf6' }, animated: true },
	{ id: 'ingest-sns', source: 'lambda-ingest', target: 'sns-alerts', label: 'Alert', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ec4899', strokeDasharray: '5 5' } },
	{ id: 'sns-cw', source: 'sns-alerts', target: 'cloudwatch', label: 'Notify', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ec4899', strokeDasharray: '5 5' } },
];

/**
 * Interactive AWS architecture diagram for FreightLens.
 */
export default function ArchitectureDiagram() {
	const onInit = useCallback(() => {}, []);

	return (
		<div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
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
