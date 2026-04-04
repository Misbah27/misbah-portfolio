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

/* ------------------------------------------------------------------ */
/*  Custom node styles                                                 */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Nodes                                                              */
/* ------------------------------------------------------------------ */

const nodes: Node[] = [
	// ── Group Labels ──
	{
		id: 'group-clients',
		type: 'default',
		position: { x: 20, y: 0 },
		data: { label: 'Clients' },
		style: { ...groupLabelStyle, borderColor: '#3b82f6', color: '#3b82f6', backgroundColor: '#eff6ff' },
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
		selectable: false,
		draggable: false,
	},
	{
		id: 'group-api',
		type: 'default',
		position: { x: 275, y: 0 },
		data: { label: 'API Layer' },
		style: { ...groupLabelStyle, borderColor: '#8b5cf6', color: '#8b5cf6', backgroundColor: '#f5f3ff' },
		selectable: false,
		draggable: false,
	},
	{
		id: 'group-compute',
		type: 'default',
		position: { x: 520, y: 0 },
		data: { label: 'Compute' },
		style: { ...groupLabelStyle, borderColor: '#f97316', color: '#f97316', backgroundColor: '#fff7ed' },
		selectable: false,
		draggable: false,
	},
	{
		id: 'group-data',
		type: 'default',
		position: { x: 770, y: 0 },
		data: { label: 'Data Layer' },
		style: { ...groupLabelStyle, borderColor: '#14b8a6', color: '#14b8a6', backgroundColor: '#f0fdfa' },
		selectable: false,
		draggable: false,
	},
	{
		id: 'group-events',
		type: 'default',
		position: { x: 275, y: 410 },
		data: { label: 'Event Pipeline (Infinity)' },
		style: { ...groupLabelStyle, borderColor: '#ec4899', color: '#ec4899', backgroundColor: '#fdf2f8' },
		selectable: false,
		draggable: false,
	},
	{
		id: 'group-infra',
		type: 'default',
		position: { x: 770, y: 410 },
		data: { label: 'Infrastructure' },
		style: { ...groupLabelStyle, borderColor: '#6b7280', color: '#6b7280', backgroundColor: '#f9fafb' },
		selectable: false,
		draggable: false,
	},

	// ── Client tier ──
	{
		id: 'ui',
		position: { x: 15, y: 70 },
		data: { label: '🖥️  React Dashboard' },
		style: { ...baseNodeStyle, borderColor: '#3b82f6', backgroundColor: '#dbeafe', color: '#1e3a5f' },
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	},
	{
		id: 'mobile',
		position: { x: 15, y: 160 },
		data: { label: '📱  FC Handheld' },
		style: { ...baseNodeStyle, borderColor: '#3b82f6', backgroundColor: '#dbeafe', color: '#1e3a5f' },
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	},

	// ── API tier ──
	{
		id: 'route53',
		position: { x: 265, y: 70 },
		data: { label: '🌐  Route 53\nDNS' },
		style: { ...baseNodeStyle, borderColor: '#8b5cf6', backgroundColor: '#ede9fe', color: '#3b1f7e', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	},
	{
		id: 'apigw',
		position: { x: 265, y: 170 },
		data: { label: '⚡  API Gateway\nREST + Auth' },
		style: { ...baseNodeStyle, borderColor: '#8b5cf6', backgroundColor: '#ede9fe', color: '#3b1f7e', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	},
	{
		id: 'midway',
		position: { x: 265, y: 275 },
		data: { label: '🔒  Midway Auth\nSSO + IAM' },
		style: { ...baseNodeStyle, borderColor: '#8b5cf6', backgroundColor: '#ede9fe', color: '#3b1f7e', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	},

	// ── Compute tier ──
	{
		id: 'lambda-api',
		position: { x: 505, y: 70 },
		data: { label: '⚙️  Node.js Lambda\nAPI Handlers' },
		style: { ...baseNodeStyle, borderColor: '#f97316', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	},
	{
		id: 'lambda-rank',
		position: { x: 505, y: 180 },
		data: { label: '🧮  Python Lambda\nRanking Engine' },
		style: { ...baseNodeStyle, borderColor: '#f97316', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	},
	{
		id: 'lambda-events',
		position: { x: 505, y: 290 },
		data: { label: '📨  Lambda Consumers\nEvent Processors' },
		style: { ...baseNodeStyle, borderColor: '#f97316', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	},

	// ── Data tier ──
	{
		id: 'rds',
		position: { x: 760, y: 80 },
		data: { label: '🗄️  MySQL RDS\nMulti-AZ' },
		style: { ...baseNodeStyle, borderColor: '#14b8a6', backgroundColor: '#ccfbf1', color: '#134e4a', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left,
		targetPosition: Position.Left,
	},
	{
		id: 'cloudwatch',
		position: { x: 760, y: 200 },
		data: { label: '📊  CloudWatch\nMetrics & Alarms' },
		style: { ...baseNodeStyle, borderColor: '#14b8a6', backgroundColor: '#ccfbf1', color: '#134e4a', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left,
		targetPosition: Position.Left,
	},
	{
		id: 's3',
		position: { x: 760, y: 310 },
		data: { label: '📦  S3\nStatic Assets' },
		style: { ...baseNodeStyle, borderColor: '#14b8a6', backgroundColor: '#ccfbf1', color: '#134e4a', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left,
		targetPosition: Position.Left,
	},

	// ── Event pipeline ──
	{
		id: 'sns-appt',
		position: { x: 210, y: 480 },
		data: { label: '📋  SNS\nAppointments' },
		style: { ...baseNodeStyle, borderColor: '#ec4899', backgroundColor: '#fce7f3', color: '#831843', whiteSpace: 'pre-line', minWidth: 110 },
		sourcePosition: Position.Top,
		targetPosition: Position.Bottom,
	},
	{
		id: 'sns-ship',
		position: { x: 360, y: 480 },
		data: { label: '🚚  SNS\nShipments' },
		style: { ...baseNodeStyle, borderColor: '#ec4899', backgroundColor: '#fce7f3', color: '#831843', whiteSpace: 'pre-line', minWidth: 110 },
		sourcePosition: Position.Top,
		targetPosition: Position.Bottom,
	},
	{
		id: 'sns-yard',
		position: { x: 510, y: 480 },
		data: { label: '🏗️  SNS\nYard Events' },
		style: { ...baseNodeStyle, borderColor: '#ec4899', backgroundColor: '#fce7f3', color: '#831843', whiteSpace: 'pre-line', minWidth: 110 },
		sourcePosition: Position.Top,
		targetPosition: Position.Bottom,
	},
	{
		id: 'sqs-dlq',
		position: { x: 360, y: 580 },
		data: { label: '⚠️  SQS DLQ\nDead Letters' },
		style: { ...baseNodeStyle, borderColor: '#ef4444', backgroundColor: '#fee2e2', color: '#7f1d1d', whiteSpace: 'pre-line', minWidth: 110 },
		sourcePosition: Position.Top,
		targetPosition: Position.Bottom,
	},

	// ── Infrastructure ──
	{
		id: 'cfn',
		position: { x: 750, y: 480 },
		data: { label: '🏗️  CloudFormation\nIaC' },
		style: { ...baseNodeStyle, borderColor: '#6b7280', backgroundColor: '#f3f4f6', color: '#1f2937', whiteSpace: 'pre-line', minWidth: 110 },
		sourcePosition: Position.Left,
		targetPosition: Position.Right,
	},
	{
		id: 'pipeline',
		position: { x: 900, y: 480 },
		data: { label: '🚀  CI/CD Pipeline\nPackage → Deploy' },
		style: { ...baseNodeStyle, borderColor: '#6b7280', backgroundColor: '#f3f4f6', color: '#1f2937', whiteSpace: 'pre-line', minWidth: 110 },
		sourcePosition: Position.Left,
		targetPosition: Position.Right,
	},
];

/* ------------------------------------------------------------------ */
/*  Edges                                                              */
/* ------------------------------------------------------------------ */

const edgeDefaults = {
	style: { strokeWidth: 2 },
	markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

const edges: Edge[] = [
	// Client → API
	{ id: 'ui-route53', source: 'ui', target: 'route53', label: 'HTTPS', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#3b82f6' } },
	{ id: 'mobile-apigw', source: 'mobile', target: 'apigw', label: 'REST', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#3b82f6' } },
	{ id: 'route53-apigw', source: 'route53', target: 'apigw', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#8b5cf6' }, animated: true },

	// Auth
	{ id: 'apigw-midway', source: 'apigw', target: 'midway', label: 'Validate', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#8b5cf6' } },

	// API → Compute
	{ id: 'apigw-lambda-api', source: 'apigw', target: 'lambda-api', label: 'Invoke', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#f97316' }, animated: true },
	{ id: 'lambda-api-rank', source: 'lambda-api', target: 'lambda-rank', label: 'Rank', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#f97316' } },

	// Compute → Data
	{ id: 'lambda-api-rds', source: 'lambda-api', target: 'rds', label: 'Query', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#14b8a6' }, animated: true },
	{ id: 'lambda-rank-rds', source: 'lambda-rank', target: 'rds', label: 'Read', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#14b8a6' } },
	{ id: 'lambda-rank-cw', source: 'lambda-rank', target: 'cloudwatch', label: 'Metrics', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#14b8a6' } },
	{ id: 'lambda-events-rds', source: 'lambda-events', target: 'rds', label: 'Upsert', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#14b8a6' } },
	{ id: 'lambda-events-cw', source: 'lambda-events', target: 'cloudwatch', label: 'Emit', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#14b8a6', strokeDasharray: '5 5' } },
	{ id: 'route53-s3', source: 'route53', target: 's3', label: 'Serve', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#14b8a6', strokeDasharray: '5 5' } },

	// Event pipeline → Compute
	{ id: 'sns-appt-lambda', source: 'sns-appt', target: 'lambda-events', label: 'Subscribe', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ec4899' }, animated: true },
	{ id: 'sns-ship-lambda', source: 'sns-ship', target: 'lambda-events', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ec4899' }, animated: true },
	{ id: 'sns-yard-lambda', source: 'sns-yard', target: 'lambda-events', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ec4899' }, animated: true },

	// DLQ
	{ id: 'sns-ship-dlq', source: 'sns-ship', target: 'sqs-dlq', label: 'Failures', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ef4444', strokeDasharray: '5 5' } },

	// Infrastructure
	{ id: 'pipeline-cfn', source: 'pipeline', target: 'cfn', label: 'Deploy', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#6b7280' } },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Interactive AWS architecture diagram for InboundIQ using React Flow.
 * Shows the distributed system: clients, API layer, compute, data, event pipeline, and infra.
 */
export default function ArchitectureDiagram() {
	const onInit = useCallback(() => {
		// Fit view on mount handled by fitView prop
	}, []);

	return (
		<div style={{ width: '100%', height: 700, border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onInit={onInit}
				fitView
				fitViewOptions={{ padding: 0.15 }}
				minZoom={0.3}
				maxZoom={1.5}
				attributionPosition="bottom-left"
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
