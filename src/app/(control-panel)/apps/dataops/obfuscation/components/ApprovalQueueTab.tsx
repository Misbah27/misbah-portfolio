'use client';

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { useSnackbar } from 'notistack';

interface ReidRequest {
	id: string;
	dataset: string;
	datasetId: string;
	requestor: string;
	reason: string;
	submitted: string;
	status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const INITIAL_REQUESTS: ReidRequest[] = [
	{ id: 'REID-001', dataset: 'hr_employees', datasetId: 'ds-004', requestor: 'a.kumar@techcorp.com', reason: 'Legal hold — employment litigation', submitted: '2024-11-10T09:00:00Z', status: 'PENDING' },
	{ id: 'REID-002', dataset: 'fin_transactions', datasetId: 'ds-002', requestor: 'j.smith@datateam.io', reason: 'Fraud investigation case #4521', submitted: '2024-11-08T14:30:00Z', status: 'PENDING' },
	{ id: 'REID-003', dataset: 'health_appointments', datasetId: 'ds-006', requestor: 'm.chen@healthit.org', reason: 'Patient data correction request', submitted: '2024-11-05T11:00:00Z', status: 'APPROVED' },
	{ id: 'REID-004', dataset: 'ecom_orders', datasetId: 'ds-003', requestor: 'l.garcia@retail.com', reason: 'GDPR data subject access request', submitted: '2024-11-01T08:00:00Z', status: 'REJECTED' },
	{ id: 'REID-005', dataset: 'edu_students', datasetId: 'ds-005', requestor: 'r.patel@university.edu', reason: 'FERPA audit compliance check', submitted: '2024-10-28T16:00:00Z', status: 'PENDING' },
	{ id: 'REID-006', dataset: 'crypto_trades', datasetId: 'ds-012', requestor: 'k.wong@compliance.io', reason: 'Regulatory reporting requirement', submitted: '2024-10-25T10:00:00Z', status: 'APPROVED' },
];

const statusColors: Record<string, 'warning' | 'success' | 'error'> = {
	PENDING: 'warning',
	APPROVED: 'success',
	REJECTED: 'error',
};

/**
 * Approval Queue tab — manage re-identification requests.
 */
export default function ApprovalQueueTab() {
	const { enqueueSnackbar } = useSnackbar();
	const [isAdmin, setIsAdmin] = useState(false);
	const [requests, setRequests] = useState<ReidRequest[]>(INITIAL_REQUESTS);
	const [rejectOpen, setRejectOpen] = useState<string | null>(null);
	const [rejectReason, setRejectReason] = useState('');

	const approve = (id: string) => {
		setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' as const } : r)));
		enqueueSnackbar('Request approved', { variant: 'success' });
	};

	const reject = (id: string) => {
		setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' as const } : r)));
		setRejectOpen(null);
		setRejectReason('');
		enqueueSnackbar('Request rejected', { variant: 'info' });
	};

	const columns: MRT_ColumnDef<ReidRequest>[] = [
		{ accessorKey: 'id', header: 'Request ID', size: 110 },
		{ accessorKey: 'dataset', header: 'Dataset', size: 150 },
		{ accessorKey: 'requestor', header: 'Requestor', size: 180 },
		{ accessorKey: 'reason', header: 'Reason', size: 250 },
		{
			accessorKey: 'submitted',
			header: 'Submitted',
			size: 130,
			Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString(),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			size: 100,
			Cell: ({ cell }) => (
				<Chip label={cell.getValue<string>()} size="small" color={statusColors[cell.getValue<string>()]} sx={{ fontSize: '0.65rem', height: 20 }} />
			),
		},
		{
			id: 'actions',
			header: 'Actions',
			size: 180,
			Cell: ({ row }) => {
				if (row.original.status !== 'PENDING') {
					if (row.original.status === 'APPROVED') {
						return <Button size="small" variant="text">Download Original</Button>;
					}
					return null;
				}
				if (!isAdmin) return <Typography variant="caption" color="text.secondary">Awaiting admin review</Typography>;
				return (
					<div className="flex gap-1">
						<Button size="small" color="success" variant="outlined" onClick={() => approve(row.original.id)}>Approve</Button>
						<Button size="small" color="error" variant="outlined" onClick={() => setRejectOpen(row.original.id)}>Reject</Button>
					</div>
				);
			},
		},
	];

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Typography className="font-semibold">Re-identification Requests</Typography>
				<Chip
					label={isAdmin ? 'Admin View' : 'User View'}
					onClick={() => setIsAdmin(!isAdmin)}
					color={isAdmin ? 'primary' : 'default'}
					variant={isAdmin ? 'filled' : 'outlined'}
					size="small"
				/>
			</div>

			<DataTable
				columns={columns as MRT_ColumnDef<ReidRequest>[]}
				data={requests}
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

			<Dialog open={!!rejectOpen} onClose={() => setRejectOpen(null)} maxWidth="sm" fullWidth>
				<DialogTitle>Reject Request</DialogTitle>
				<DialogContent>
					<TextField
						label="Rejection Reason"
						fullWidth
						size="small"
						multiline
						rows={3}
						value={rejectReason}
						onChange={(e) => setRejectReason(e.target.value)}
						className="mt-2"
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setRejectOpen(null)}>Cancel</Button>
					<Button variant="contained" color="error" onClick={() => rejectOpen && reject(rejectOpen)}>Reject</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
