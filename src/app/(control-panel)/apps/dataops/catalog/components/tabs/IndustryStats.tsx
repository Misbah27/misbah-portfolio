'use client';

import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {
	PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, Legend,
} from 'recharts';
import type { DatasetCatalogEntry, DataRow, IndustryTag } from '../../../types';

const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#795548', '#E91E63'];

function countBy(rows: DataRow[], key: string): { name: string; value: number }[] {
	const map: Record<string, number> = {};
	rows.forEach((r) => {
		const v = String(r[key] ?? 'Unknown');
		map[v] = (map[v] || 0) + 1;
	});
	return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
}

function avgOf(rows: DataRow[], key: string): number {
	const nums = rows.map((r) => Number(r[key])).filter((n) => !isNaN(n));
	return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function pctOf(rows: DataRow[], key: string, match: (v: unknown) => boolean): number {
	const matched = rows.filter((r) => match(r[key])).length;
	return rows.length ? (matched / rows.length) * 100 : 0;
}

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<Paper variant="outlined" className="p-3 text-center">
			<Typography className="text-xl font-bold">{value}</Typography>
			<Typography variant="caption" color="text.secondary">{label}</Typography>
		</Paper>
	);
}

function MiniPie({ data, title }: { data: { name: string; value: number }[]; title: string }) {
	return (
		<Paper variant="outlined" className="p-2">
			<Typography variant="caption" className="font-semibold block mb-1">{title}</Typography>
			<ResponsiveContainer width="100%" height={180}>
				<PieChart>
					<Pie data={data.slice(0, 6)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
						{data.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
					</Pie>
					<Tooltip />
				</PieChart>
			</ResponsiveContainer>
		</Paper>
	);
}

function MiniBar({ data, title }: { data: { name: string; value: number }[]; title: string }) {
	return (
		<Paper variant="outlined" className="p-2">
			<Typography variant="caption" className="font-semibold block mb-1">{title}</Typography>
			<ResponsiveContainer width="100%" height={180}>
				<BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 60 }}>
					<XAxis type="number" tick={{ fontSize: 10 }} />
					<YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={55} />
					<Tooltip />
					<Bar dataKey="value" fill="#2196F3" />
				</BarChart>
			</ResponsiveContainer>
		</Paper>
	);
}

interface Props {
	entry: DatasetCatalogEntry;
	rows: DataRow[];
}

/**
 * Industry-specific stat cards and charts for Preview tab.
 */
export default function IndustryStats({ entry, rows }: Props) {
	const tag = entry.industryTag;

	const content = useMemo(() => {
		switch (tag) {
			case 'LUXURY_RESALE':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<MiniPie data={countBy(rows, 'condition')} title="Condition Distribution" />
						<MiniBar data={countBy(rows, 'brand').slice(0, 8)} title="Top Brands" />
						<StatCard label="Avg Days to Sell" value={avgOf(rows, 'daysToSell').toFixed(0)} />
						<StatCard label="Auth Pass Rate" value={`${pctOf(rows, 'authenticationStatus', (v) => v === 'Authenticated').toFixed(0)}%`} />
					</div>
				);
			case 'FINTECH':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<StatCard label="Fraud Rate" value={`${pctOf(rows, 'fraudFlag', (v) => v === true).toFixed(1)}%`} />
						<MiniPie data={countBy(rows, 'transactionType')} title="Transaction Types" />
						<MiniBar data={countBy(rows, 'merchantCategory').slice(0, 5)} title="Top Merchant Categories" />
						<StatCard label="Avg Transaction" value={`$${avgOf(rows, 'amount').toFixed(2)}`} />
					</div>
				);
			case 'ECOMMERCE':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<StatCard label="Return Rate" value={`${pctOf(rows, 'returnedAt', (v) => v != null).toFixed(1)}%`} />
						<MiniPie data={countBy(rows, 'orderStatus')} title="Order Status" />
						<StatCard label="Avg Order Value" value={`$${avgOf(rows, 'totalAmount').toFixed(2)}`} />
						<MiniPie data={countBy(rows, 'paymentMethod')} title="Payment Methods" />
					</div>
				);
			case 'HR': {
				const salaryBuckets: Record<string, number> = {};
				rows.forEach((r) => {
					const s = Number(r.baseSalary) || 0;
					const bucket = `$${Math.floor(s / 20000) * 20}k-${Math.floor(s / 20000) * 20 + 20}k`;
					salaryBuckets[bucket] = (salaryBuckets[bucket] || 0) + 1;
				});
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<MiniBar data={Object.entries(salaryBuckets).map(([name, value]) => ({ name, value }))} title="Salary Distribution" />
						<MiniBar data={countBy(rows, 'department')} title="Department Headcount" />
						<MiniPie data={countBy(rows, 'performanceScore')} title="Performance Ratings" />
						<StatCard label="Avg Salary" value={`$${(avgOf(rows, 'baseSalary') / 1000).toFixed(0)}k`} />
					</div>
				);
			}
			case 'EDTECH':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<MiniPie data={countBy(rows, 'graduationStatus')} title="Graduation Status" />
						<StatCard label="Avg GPA" value={avgOf(rows, 'gpa').toFixed(2)} />
						<StatCard label="Avg Financial Aid" value={`$${avgOf(rows, 'financialAidAmount').toFixed(0)}`} />
						<MiniBar data={countBy(rows, 'major').slice(0, 6)} title="Top Majors" />
					</div>
				);
			case 'HEALTHCARE':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<MiniPie data={countBy(rows, 'specialty')} title="Provider Specialties" />
						<StatCard label="Avg Billing" value={`$${avgOf(rows, 'billingAmount').toFixed(0)}`} />
						<StatCard label="Avg Patient Resp." value={`$${avgOf(rows, 'patientResponsibility').toFixed(0)}`} />
						<MiniPie data={countBy(rows, 'appointmentType')} title="Appointment Types" />
					</div>
				);
			case 'SUPPLY_CHAIN':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<StatCard label="Below Reorder" value={String(rows.filter((r) => Number(r.quantityAvailable) < Number(r.reorderPoint)).length)} />
						<StatCard label="Hazardous Items" value={`${pctOf(rows, 'hazardousFlag', (v) => v === true).toFixed(0)}%`} />
						<MiniBar data={countBy(rows, 'category').slice(0, 6)} title="Product Categories" />
						<StatCard label="Avg Unit Cost" value={`$${avgOf(rows, 'unitCost').toFixed(2)}`} />
					</div>
				);
			case 'MARKETING':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<StatCard label="Avg CTR" value={`${(avgOf(rows, 'ctr') * 100).toFixed(2)}%`} />
						<StatCard label="Avg CVR" value={`${(avgOf(rows, 'cvr') * 100).toFixed(2)}%`} />
						<StatCard label="Avg ROAS" value={`${avgOf(rows, 'roas').toFixed(2)}x`} />
						<MiniPie data={countBy(rows, 'channel')} title="Channel Distribution" />
					</div>
				);
			case 'IOT':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<StatCard label="Anomaly Rate" value={`${pctOf(rows, 'isAnomaly', (v) => v === true).toFixed(1)}%`} />
						<MiniPie data={countBy(rows, 'deviceType')} title="Sensor Types" />
						<MiniBar data={countBy(rows, 'zone')} title="Zone Distribution" />
						<StatCard label="Avg Signal" value={`${avgOf(rows, 'signalStrength').toFixed(0)} dBm`} />
					</div>
				);
			case 'PROPTECH':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<MiniPie data={countBy(rows, 'propertyType')} title="Property Types" />
						<StatCard label="Avg $/sqft" value={`$${avgOf(rows, 'pricePerSqFt').toFixed(0)}`} />
						<StatCard label="Avg Days on Market" value={avgOf(rows, 'daysOnMarket').toFixed(0)} />
						<MiniBar data={countBy(rows, 'city').slice(0, 6)} title="Top Cities" />
					</div>
				);
			case 'MEDIA':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<MiniPie data={countBy(rows, 'contentType')} title="Content Types" />
						<MiniPie data={countBy(rows, 'deviceType')} title="Device Distribution" />
						<StatCard label="Avg Completion" value={`${(avgOf(rows, 'completionRate') * 100).toFixed(0)}%`} />
						<MiniBar data={countBy(rows, 'genre').slice(0, 6)} title="Top Genres" />
					</div>
				);
			case 'WEB3':
				return (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<MiniPie data={countBy(rows, 'tradeType')} title="Trade Types" />
						<MiniBar data={countBy(rows, 'exchange').slice(0, 6)} title="Top Exchanges" />
						<StatCard label="Avg Gas Fee" value={`$${avgOf(rows, 'networkGasFee').toFixed(2)}`} />
						<StatCard label="Failed TX Rate" value={`${pctOf(rows, 'status', (v) => v === 'FAILED').toFixed(1)}%`} />
					</div>
				);
			default:
				return null;
		}
	}, [tag, rows]);

	if (!content) return null;

	return (
		<div className="mt-3">
			<Typography className="font-semibold mb-2">Industry Analytics</Typography>
			{content}
		</div>
	);
}
