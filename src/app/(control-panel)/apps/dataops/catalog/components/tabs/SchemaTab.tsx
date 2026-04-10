'use client';

import { useMemo } from 'react';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import DataTable from 'src/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import type { DatasetCatalogEntry } from '../../../types';

interface SchemaRow {
	name: string;
	inferredType: string;
	piiType: string | null;
	obfuscationRule: string;
	description: string;
	isPii: boolean;
}

const piiColors: Record<string, 'error' | 'warning' | 'info'> = {
	DIRECT_IDENTIFIER: 'error',
	QUASI_IDENTIFIER: 'warning',
	SENSITIVE_ATTRIBUTE: 'info',
};

interface Props {
	entry: DatasetCatalogEntry;
}

/**
 * Schema tab — DataTable of columns with PII highlights.
 */
export default function SchemaTab({ entry }: Props) {
	const rows = useMemo<SchemaRow[]>(() => {
		const piiMap = new Map(entry.piiColumns.map((p) => [p.column, p]));
		return entry.schema.map((col) => {
			const pii = piiMap.get(col.name);
			return {
				name: col.name,
				inferredType: col.inferredType,
				piiType: pii?.piiType || null,
				obfuscationRule: pii ? 'FORMAT_PRESERVE' : 'KEEP',
				description: col.description || `${col.nullable ? 'Nullable' : 'Required'} — e.g. ${(col.sampleValues || []).filter(Boolean).slice(0, 2).join(', ') || 'N/A'}`,
				isPii: !!pii,
			};
		});
	}, [entry]);

	const columns = useMemo<MRT_ColumnDef<SchemaRow>[]>(
		() => [
			{
				accessorKey: 'name',
				header: 'Column Name',
				size: 180,
				Cell: ({ row }) => (
					<div className="flex items-center gap-1">
						<span className="font-mono text-sm">{row.original.name}</span>
					</div>
				),
			},
			{
				accessorKey: 'inferredType',
				header: 'Inferred Type',
				size: 130,
				Cell: ({ row }) => (
					<div className="flex items-center gap-1">
						{row.original.inferredType === 'IMAGE_URL' && (
							<FuseSvgIcon size={14}>heroicons-outline:photo</FuseSvgIcon>
						)}
						<span>{row.original.inferredType}</span>
					</div>
				),
			},
			{
				accessorKey: 'piiType',
				header: 'PII Type',
				size: 160,
				Cell: ({ row }) =>
					row.original.piiType ? (
						<Chip
							label={row.original.piiType.replace(/_/g, ' ')}
							size="small"
							color={piiColors[row.original.piiType] || 'default'}
							sx={{ fontSize: '0.65rem', height: 20 }}
						/>
					) : (
						<span className="text-gray-400">—</span>
					),
			},
			{
				accessorKey: 'obfuscationRule',
				header: 'Obfuscation Rule',
				size: 140,
			},
			{
				accessorKey: 'description',
				header: 'Description',
				size: 260,
			},
		],
		[]
	);

	const handleExport = () => {
		const csv = [
			['Column', 'Type', 'PII Type', 'Obfuscation', 'Description'].join(','),
			...rows.map((r) => [r.name, r.inferredType, r.piiType || '', r.obfuscationRule, `"${r.description}"`].join(',')),
		].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${entry.name}_schema.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-2">
			<div className="flex justify-end">
				<Button
					size="small"
					variant="outlined"
					startIcon={<FuseSvgIcon size={14}>heroicons-outline:arrow-down-tray</FuseSvgIcon>}
					onClick={handleExport}
				>
					Export Schema
				</Button>
			</div>
			<DataTable
				columns={columns as MRT_ColumnDef<SchemaRow>[]}
				data={rows}
				enableRowSelection={false}
				enableRowActions={false}
				enableColumnOrdering={false}
				enableGrouping={false}
				enableColumnPinning={false}
				enableDensityToggle={false}
				enableHiding={false}
				enableFilters={false}
				enablePagination={false}
				enableBottomToolbar={false}
				enableTopToolbar={false}
				enableStickyHeader
				initialState={{ density: 'compact' }}
				muiTableBodyRowProps={({ row }) => ({
					sx: row.original.isPii ? { backgroundColor: 'rgba(255, 152, 0, 0.06)' } : {},
				})}
			/>
		</div>
	);
}
