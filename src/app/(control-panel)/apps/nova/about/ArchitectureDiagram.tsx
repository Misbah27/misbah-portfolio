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
		id: 'group-compute', type: 'default', position: { x: 540, y: 0 },
		data: { label: 'Compute & Orchestration' },
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
		id: 'telemetry', position: { x: 15, y: 70 },
		data: { label: 'Vehicle Telemetry\nGPS + ETA Updates' },
		style: { ...baseNodeStyle, borderColor: '#dc2626', backgroundColor: '#fee2e2', color: '#7f1d1d', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'carrier', position: { x: 15, y: 180 },
		data: { label: 'Carrier Status\nSCAC Updates' },
		style: { ...baseNodeStyle, borderColor: '#dc2626', backgroundColor: '#fee2e2', color: '#7f1d1d', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'schedule', position: { x: 15, y: 290 },
		data: { label: 'Transit Schedule\nPlanned Routes' },
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
		id: 'sns', position: { x: 265, y: 180 },
		data: { label: 'SNS\nDelay Notifications' },
		style: { ...baseNodeStyle, borderColor: '#ea580c', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'sqs', position: { x: 265, y: 290 },
		data: { label: 'SQS\nRescue Queue' },
		style: { ...baseNodeStyle, borderColor: '#ea580c', backgroundColor: '#ffedd5', color: '#7c2d12', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},

	// ── Compute ──
	{
		id: 'lambda-delay', position: { x: 530, y: 70 },
		data: { label: 'Lambda\nDelay Detection' },
		style: { ...baseNodeStyle, borderColor: '#9333ea', backgroundColor: '#f3e8ff', color: '#581c87', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'step-fn', position: { x: 530, y: 180 },
		data: { label: 'Step Functions\nRescue Workflow' },
		style: { ...baseNodeStyle, borderColor: '#9333ea', backgroundColor: '#f3e8ff', color: '#581c87', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'lambda-llm', position: { x: 530, y: 290 },
		data: { label: 'Lambda\nLLM Analysis' },
		style: { ...baseNodeStyle, borderColor: '#9333ea', backgroundColor: '#f3e8ff', color: '#581c87', whiteSpace: 'pre-line' },
		sourcePosition: Position.Right, targetPosition: Position.Left,
	},
	{
		id: 'anthropic', position: { x: 530, y: 390 },
		data: { label: 'Anthropic Claude\nIntelligence Brief' },
		style: { ...baseNodeStyle, borderColor: '#9333ea', backgroundColor: '#f3e8ff', color: '#581c87', whiteSpace: 'pre-line' },
		sourcePosition: Position.Top, targetPosition: Position.Bottom,
	},

	// ── Data & Presentation ──
	{
		id: 'dynamo', position: { x: 800, y: 70 },
		data: { label: 'DynamoDB\nAlerts + Rescues' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
	{
		id: 'cloudwatch', position: { x: 800, y: 180 },
		data: { label: 'CloudWatch\nDelay Volume Alarms' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
	{
		id: 'apigw', position: { x: 800, y: 290 },
		data: { label: 'API Gateway\nDashboard API' },
		style: { ...baseNodeStyle, borderColor: '#2563eb', backgroundColor: '#dbeafe', color: '#1e3a5f', whiteSpace: 'pre-line' },
		sourcePosition: Position.Left, targetPosition: Position.Left,
	},
	{
		id: 'ui', position: { x: 800, y: 390 },
		data: { label: 'React Dashboard\nNOC + Rescue Planner' },
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
	{ id: 'tel-kinesis', source: 'telemetry', target: 'kinesis', label: 'Stream', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#dc2626' }, animated: true },
	{ id: 'carrier-kinesis', source: 'carrier', target: 'kinesis', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#dc2626' }, animated: true },
	{ id: 'sched-kinesis', source: 'schedule', target: 'kinesis', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#dc2626' } },
	// Stream → Compute
	{ id: 'kinesis-delay', source: 'kinesis', target: 'lambda-delay', label: 'Consume', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ea580c' }, animated: true },
	{ id: 'sns-stepfn', source: 'sns', target: 'step-fn', label: 'Trigger', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ea580c' }, animated: true },
	{ id: 'sqs-stepfn', source: 'sqs', target: 'step-fn', label: 'Queue', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#ea580c' } },
	// Compute internal
	{ id: 'delay-sns', source: 'lambda-delay', target: 'sns', label: 'Publish', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#9333ea' } },
	{ id: 'anthropic-llm', source: 'anthropic', target: 'lambda-llm', label: 'API', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#9333ea' } },
	// Compute → Data
	{ id: 'delay-dynamo', source: 'lambda-delay', target: 'dynamo', label: 'Write', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' }, animated: true },
	{ id: 'stepfn-dynamo', source: 'step-fn', target: 'dynamo', label: 'Update', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' } },
	{ id: 'delay-cw', source: 'lambda-delay', target: 'cloudwatch', label: 'Metrics', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb', strokeDasharray: '5 5' } },
	// Presentation
	{ id: 'apigw-dynamo', source: 'apigw', target: 'dynamo', label: 'Query', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' } },
	{ id: 'ui-apigw', source: 'ui', target: 'apigw', label: 'REST', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#2563eb' }, animated: true },
	{ id: 'apigw-llm', source: 'apigw', target: 'lambda-llm', label: 'LLM', ...edgeDefaults, style: { ...edgeDefaults.style, stroke: '#9333ea', strokeDasharray: '5 5' } },
];

/**
 * Interactive AWS architecture diagram for Nova.
 */
export default function ArchitectureDiagram() {
	const onInit = useCallback(() => {}, []);

	return (
		<div style={{ width: '100%', height: 550, border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
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
