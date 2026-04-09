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
		id: 'group-sources', type: 'default', position: { x: 20, y: 0 },
		data: { label: 'Data Sources' },
		style: { ...groupLabelStyle, borderColor: '#dc2626', color: '#dc2626', backgroundColor: '#fef2f2' },
		selectable: false, draggable: false,
	},
	{
		id: 'group-stream', type: 'default', position: { x: 275, y: 0 },
		data: { label: 'Stream Processing' },
		style: { ...groupLabelStyle, borderColor: '#ea580c', color: '#ea580c', backgroundColor: '#fff7ed' },
		selectable: false, draggable: false,
	},
	{
		id: 'group-compute', type: 'default', position: { x: 530, y: 0 },
		data: { label: 'Detection & ML' },
		style: { ...groupLabelStyle, borderColor: '#9333ea', color: '#9333ea', backgroundColor: '#faf5ff' },
		selectable: false, draggable: false,
	},
	{
		id: 'group-data', type: 'default', position: { x: 810, y: 0 },
		data: { label: 'Data & Presentation' },
		style: { ...groupLabelStyle, borderColor: '#2563eb', color: '#2563eb', backgroundColor: '#eff6ff' },
		selectable: false, draggable: false,
	},

	// ── Data Sources ──
	{
		id: 'gps', position: { x: 15, y: 70 },
		data: { label: 'GPS Device\nDriver Phones' },
		style: { ...baseNodeStyle, borderColor: '#dc2626', backgroundColor: '#fee2e2', color: '#7f1d1d', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'delivery-app', position: { x: 15, y: 180 },
		data: { label: 'Delivery App\nCompletion Events' },
		style: { ...baseNodeStyle, borderColor: '#dc2626', backgroundColor: '#fee2e2', color: '#7f1d1d', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'dispatch', position: { x: 15, y: 290 },
		data: { label: 'Dispatch System\nOrder Assignments' },
		style: { ...baseNodeStyle, borderColor: '#dc2626', backgroundColor: '#fee2e2', color: '#7f1d1d', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},

	// ── Stream Processing ──
	{
		id: 'kinesis', position: { x: 265, y: 70 },
		data: { label: 'Kinesis\nData Streams' },
		style: { ...baseNodeStyle, borderColor: '#ea580c', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'kda', position: { x: 265, y: 180 },
		data: { label: 'Kinesis Analytics\nCluster Detection' },
		style: { ...baseNodeStyle, borderColor: '#ea580c', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'sns', position: { x: 265, y: 290 },
		data: { label: 'SNS\nFraud Alerts' },
		style: { ...baseNodeStyle, borderColor: '#ea580c', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},

	// ── Detection & ML ──
	{
		id: 'lambda', position: { x: 520, y: 70 },
		data: { label: 'Lambda\nEvent Processor' },
		style: { ...baseNodeStyle, borderColor: '#9333ea', backgroundColor: '#f3e8ff', color: '#581c87', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'sagemaker', position: { x: 520, y: 180 },
		data: { label: 'SageMaker\nAnomaly Detection' },
		style: { ...baseNodeStyle, borderColor: '#9333ea', backgroundColor: '#f3e8ff', color: '#581c87', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'lambda-llm', position: { x: 520, y: 290 },
		data: { label: 'Lambda\nLLM Analysis' },
		style: { ...baseNodeStyle, borderColor: '#9333ea', backgroundColor: '#f3e8ff', color: '#581c87', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'anthropic', position: { x: 520, y: 400 },
		data: { label: 'Anthropic Claude\nInvestigation AI' },
		style: { ...baseNodeStyle, borderColor: '#9333ea', backgroundColor: '#f3e8ff', color: '#581c87', whiteSpace: 'pre-line' },
		sourcePosition: Position.Top, targetPosition: Position.Bottom,
	},

	// ── Data & Presentation ──
	{
		id: 'dynamo', position: { x: 800, y: 70 },
		data: { label: 'DynamoDB\nDriver State + Alerts' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
	{
		id: 's3', position: { x: 800, y: 180 },
		data: { label: 'S3\nGPS Trace Archive' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
	{
		id: 'apigw', position: { x: 800, y: 290 },
		data: { label: 'API Gateway\nREST API' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
	{
		id: 'ui', position: { x: 800, y: 400 },
		data: { label: 'React Dashboard\nLive Monitor + Maps' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
];

const edgeDefaults = {
	style: { strokeWidth: 2 },
	markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

const edges: Edge[] = [
	// Sources → Stream
	{ id: 'gps-kinesis', source: 'gps', target: 'kinesis', label: '5s pings', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#dc2626' }, animated: true },
	{ id: 'app-kinesis', source: 'delivery-app', target: 'kinesis', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#dc2626' }, animated: true },
	{ id: 'dispatch-kinesis', source: 'dispatch', target: 'kinesis', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#dc2626' } },
	// Stream → Compute
	{ id: 'kinesis-lambda', source: 'kinesis', target: 'lambda', label: 'Consume', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ea580c' }, animated: true },
	{ id: 'kinesis-kda', source: 'kinesis', target: 'kda', label: 'SQL', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ea580c' } },
	// Compute internal
	{ id: 'lambda-sagemaker', source: 'lambda', target: 'sagemaker', label: 'Score', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#9333ea' }, animated: true },
	{ id: 'lambda-sns', source: 'lambda', target: 'sns', label: 'Alert', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#9333ea' } },
	{ id: 'anthropic-llm', source: 'anthropic', target: 'lambda-llm', label: 'API', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#9333ea' } },
	{ id: 'kda-lambda', source: 'kda', target: 'sagemaker', label: 'Cluster', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ea580c', strokeDasharray: '5 5' } },
	// Compute → Data
	{ id: 'lambda-dynamo', source: 'lambda', target: 'dynamo', label: 'Write', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' }, animated: true },
	{ id: 'sagemaker-dynamo', source: 'sagemaker', target: 'dynamo', label: 'Scores', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' } },
	{ id: 'lambda-s3', source: 'lambda', target: 's3', label: 'Archive', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb', strokeDasharray: '5 5' } },
	// Presentation
	{ id: 'apigw-dynamo', source: 'apigw', target: 'dynamo', label: 'Query', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' } },
	{ id: 'apigw-llm', source: 'apigw', target: 'lambda-llm', label: 'LLM', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#9333ea', strokeDasharray: '5 5' } },
	{ id: 'ui-apigw', source: 'ui', target: 'apigw', label: 'REST', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' }, animated: true },
	{ id: 'sns-ui', source: 'sns', target: 'ui', label: 'Push', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ea580c', strokeDasharray: '5 5' } },
];

/**
 * Interactive AWS architecture diagram for LoFAT fraud detection platform.
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
