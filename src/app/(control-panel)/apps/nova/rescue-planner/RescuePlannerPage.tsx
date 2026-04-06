'use client';

import { useState, useEffect, useCallback } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Skeleton from '@mui/material/Skeleton';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import { motion } from 'motion/react';
import NovaSidebar from '../components/NovaSidebar';
import HomeTab from '../components/rescue/HomeTab';
import EditTab from '../components/rescue/EditTab';
import PlanTab from '../components/rescue/PlanTab';
import CheckTab from '../components/rescue/CheckTab';
import FollowUpTab from '../components/rescue/FollowUpTab';
import { ROLE_OPTIONS, ROLE_TAB_ACCESS, type RescueRecord, type RescueRole } from '../types';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'&.FusePageSimple-scroll-content': { height: '100%' },
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		borderBottomWidth: 1, borderStyle: 'solid', borderColor: theme.vars.palette.divider,
	},
	'& .FusePageSimple-content': { backgroundColor: theme.vars.palette.background.default },
	'& .FusePageSimple-leftSidebar': {
		backgroundColor: theme.vars.palette.background.paper,
		borderRightWidth: 1, borderStyle: 'solid', borderColor: theme.vars.palette.divider,
	},
}));

const TAB_DEFS = [
	{ idx: 0, label: 'Home', icon: 'heroicons-outline:home' },
	{ idx: 1, label: 'Edit', icon: 'heroicons-outline:pencil-square' },
	{ idx: 2, label: 'Plan', icon: 'heroicons-outline:clipboard-document-list' },
	{ idx: 3, label: 'Check', icon: 'heroicons-outline:magnifying-glass-circle' },
	{ idx: 4, label: 'Follow Up', icon: 'heroicons-outline:arrow-path' },
] as const;

/**
 * Rescue Planner — 5-tab workflow with role-based access control.
 */
function RescuePlannerPage() {
	const [rescues, setRescues] = useState<RescueRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState(0);
	const [role, setRole] = useState<RescueRole>('Internal NOC');
	const [selectedRescue, setSelectedRescue] = useState<RescueRecord | null>(null);

	useEffect(() => {
		import('@/data/nova/rescues.json')
			.then((mod) => setRescues(mod.default as RescueRecord[]))
			.catch(() => setRescues([]))
			.finally(() => setLoading(false));
	}, []);

	const allowedTabs = ROLE_TAB_ACCESS[role];

	useEffect(() => {
		if (!allowedTabs.includes(activeTab)) {
			setActiveTab(allowedTabs[0]);
		}
	}, [role, activeTab, allowedTabs]);

	const handleSelectRescue = useCallback((rescue: RescueRecord) => {
		setSelectedRescue(rescue);
		if (allowedTabs.includes(1)) setActiveTab(1);
	}, [allowedTabs]);

	const handleDeleteRescue = useCallback((rescueId: string) => {
		setRescues((prev) => prev.filter((r) => r.rescueId !== rescueId));
		if (selectedRescue?.rescueId === rescueId) setSelectedRescue(null);
	}, [selectedRescue]);

	const handleCreateRescue = useCallback((data: { origin: string; destination: string; vrid: string; rescueDate: string; retrievalTime: string; eddSplit: string; reason: string }) => {
		const newRescue: RescueRecord = {
			rescueId: `RSC-${3000 + rescues.length}`,
			odPair: `${data.origin}→${data.destination}`,
			vrid: data.vrid,
			rescueDate: new Date(data.rescueDate).toISOString(),
			retrievalTime: new Date(data.retrievalTime).toISOString(),
			eddSplit: data.eddSplit,
			reasonForDelay: data.reason,
			haulType: 'LH',
			lane: `${data.origin}→${data.destination}`,
			status: 'PENDING',
			eta: new Date(data.retrievalTime).toISOString(),
			eddPackageCount: Math.floor(Math.random() * 100) + 10,
			vehicleSize: '53FT',
			algorithmRecommendation: 'RESCUE',
			clientApprovals: [false, false, false],
		};
		setRescues((prev) => [newRescue, ...prev]);
	}, [rescues.length]);

	const handleSaveEdit = useCallback((rescueId: string, updates: { retrievalTime: string; reasonForDelay: string }) => {
		setRescues((prev) => prev.map((r) => r.rescueId === rescueId ? { ...r, ...updates } : r));
		setSelectedRescue((prev) => prev?.rescueId === rescueId ? { ...prev, ...updates } : prev);
	}, []);

	const handleUpdateApprovals = useCallback((rescueId: string, approvals: [boolean, boolean, boolean]) => {
		setRescues((prev) => prev.map((r) => r.rescueId === rescueId ? { ...r, clientApprovals: approvals } : r));
		setSelectedRescue((prev) => prev?.rescueId === rescueId ? { ...prev, clientApprovals: approvals } : prev);
	}, []);

	return (
		<Root
			scroll="content"
			header={
				<div className="flex flex-col gap-1 w-full p-6 sm:px-8">
					<PageBreadcrumb />
					<div className="flex items-center justify-between mt-1">
						<div className="flex items-center gap-2">
							<FuseSvgIcon size={28} color="action">heroicons-outline:lifebuoy</FuseSvgIcon>
							<div>
								<Typography className="text-2xl font-bold tracking-tight">Rescue Planner</Typography>
								<Typography variant="caption" color="text.secondary">Automated rescue planning for delayed shipments</Typography>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<Chip label={role} size="small" color="secondary" variant="outlined" icon={<FuseSvgIcon size={14}>heroicons-outline:user-circle</FuseSvgIcon>} />
							<TextField
								select size="small" label="Role" value={role}
								onChange={(e) => setRole(e.target.value as RescueRole)}
								sx={{ minWidth: 180 }}
							>
								{ROLE_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
							</TextField>
						</div>
					</div>
				</div>
			}
			leftSidebarContent={<NovaSidebar />}
			leftSidebarOpen
			leftSidebarWidth={280}
			leftSidebarVariant="permanent"
			content={
				<div className="w-full p-6 sm:p-8">
					{loading ? (
						<div className="space-y-3">
							<Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
							<div className="grid grid-cols-4 gap-4">
								{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rectangular" height={70} />)}
							</div>
							<Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
						</div>
					) : (
						<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
							<Tabs
								value={activeTab}
								onChange={(_, v: number) => setActiveTab(v)}
								sx={{ minHeight: 36, mb: 3, '& .MuiTab-root': { minHeight: 36, textTransform: 'none' } }}
							>
								{TAB_DEFS.filter((t) => allowedTabs.includes(t.idx)).map((t) => (
									<Tab
										key={t.idx} value={t.idx} label={t.label}
										icon={<FuseSvgIcon size={16}>{t.icon}</FuseSvgIcon>}
										iconPosition="start"
									/>
								))}
							</Tabs>

							{activeTab === 0 && <HomeTab rescues={rescues} role={role} onSelectRescue={handleSelectRescue} onDeleteRescue={handleDeleteRescue} onCreateRescue={handleCreateRescue} />}
							{activeTab === 1 && <EditTab rescue={selectedRescue} onSave={handleSaveEdit} />}
							{activeTab === 2 && <PlanTab rescues={rescues} role={role} selectedRescue={selectedRescue} onUpdateApprovals={handleUpdateApprovals} />}
							{activeTab === 3 && <CheckTab rescues={rescues} />}
							{activeTab === 4 && <FollowUpTab rescues={rescues} />}
						</motion.div>
					)}
				</div>
			}
		/>
	);
}

export default RescuePlannerPage;
