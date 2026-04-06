'use client';

import { useMemo } from 'react';
import Chip from '@mui/material/Chip';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';

interface AuditEvent {
	timestamp: string;
	eventType: string;
	dataset: string;
	actor: string;
	details: string;
}

const EVENT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
	JOB_SUBMITTED: 'info',
	JOB_COMPLETED: 'success',
	REID_REQUESTED: 'warning',
	REID_APPROVED: 'success',
	REID_REJECTED: 'error',
	SEED_ACCESSED: 'default',
};

function generateHistoricalEvents(): AuditEvent[] {
	const events: AuditEvent[] = [];
	const datasets = ['hr_employees', 'fin_transactions', 'ecom_orders', 'health_appointments', 'edu_students', 'crypto_trades'];
	const actors = ['a.kumar@techcorp.com', 'j.smith@datateam.io', 'm.chen@healthit.org', 'l.garcia@retail.com', 'system'];
	const types: string[] = ['JOB_SUBMITTED', 'JOB_COMPLETED', 'REID_REQUESTED', 'REID_APPROVED', 'REID_REJECTED', 'SEED_ACCESSED'];

	for (let i = 0; i < 20; i++) {
		const daysAgo = Math.floor(Math.random() * 7);
		const hours = Math.floor(Math.random() * 24);
		const date = new Date();
		date.setDate(date.getDate() - daysAgo);
		date.setHours(hours, Math.floor(Math.random() * 60));

		const eventType = types[i % types.length];
		const dataset = datasets[i % datasets.length];
		const actor = actors[i % actors.length];

		let details = '';
		switch (eventType) {
			case 'JOB_SUBMITTED': details = `Obfuscation job submitted for ${dataset} (500 rows)`; break;
			case 'JOB_COMPLETED': details = `Job completed in ${800 + Math.floor(Math.random() * 2200)}ms`; break;
			case 'REID_REQUESTED': details = `Re-identification requested for ${dataset}`; break;
			case 'REID_APPROVED': details = `Re-identification approved — original data released`; break;
			case 'REID_REJECTED': details = `Re-identification denied — insufficient justification`; break;
			case 'SEED_ACCESSED': details = `Seed viewed by ${actor}`; break;
		}

		events.push({ timestamp: date.toISOString(), eventType, dataset, actor, details });
	}

	return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const columns: MRT_ColumnDef<AuditEvent>[] = [
	{
		accessorKey: 'timestamp',
		header: 'Timestamp',
		size: 170,
		Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleString(),
	},
	{
		accessorKey: 'eventType',
		header: 'Event Type',
		size: 150,
		Cell: ({ cell }) => (
			<Chip
				label={cell.getValue<string>()}
				size="small"
				color={EVENT_COLORS[cell.getValue<string>()] || 'default'}
				sx={{ fontSize: '0.65rem', height: 20 }}
			/>
		),
	},
	{ accessorKey: 'dataset', header: 'Dataset', size: 150 },
	{ accessorKey: 'actor', header: 'Actor', size: 180 },
	{ accessorKey: 'details', header: 'Details', size: 350 },
];

/**
 * Audit Log tab — chronological event stream.
 */
export default function AuditLogTab() {
	const events = useMemo(() => generateHistoricalEvents(), []);

	return (
		<DataTable
			columns={columns as MRT_ColumnDef<AuditEvent>[]}
			data={events}
			enableRowSelection={false}
			enableRowActions={false}
			enableColumnOrdering={false}
			enableGrouping={false}
			enableColumnPinning={false}
			enableDensityToggle={false}
			enableHiding={false}
			enablePagination={false}
			enableBottomToolbar={false}
			enableTopToolbar={false}
			enableStickyHeader
			initialState={{ density: 'compact' }}
		/>
	);
}
