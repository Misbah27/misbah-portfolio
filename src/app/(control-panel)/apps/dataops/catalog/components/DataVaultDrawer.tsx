'use client';

import { useState, useRef, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Badge from '@mui/material/Badge';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { INDUSTRY_COLORS, INDUSTRY_LABELS, type DatasetCatalogEntry } from '../../types';

interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
	datasetCards?: string[];
}

const SUGGESTED_QUERIES = [
	'Which datasets have GDPR-sensitive PII?',
	'Show luxury resale data with quality above 80',
	'What depends on the orders dataset?',
	'Best dataset for fraud detection training?',
	'Which datasets have product images?',
	'Datasets needing HIPAA compliance?',
];

function qualityColor(score: number | null): 'success' | 'warning' | 'error' {
	if (!score) return 'error';
	if (score >= 80) return 'success';
	if (score >= 60) return 'warning';
	return 'error';
}

interface Props {
	open: boolean;
	onClose: () => void;
	catalog: DatasetCatalogEntry[];
	onOpenDataset: (entry: DatasetCatalogEntry) => void;
}

/**
 * Ask DataVault chat drawer — AI-powered catalog assistant.
 */
export default function DataVaultDrawer({ open, onClose, catalog, onOpenDataset }: Props) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages, loading]);

	const send = async (text: string) => {
		if (!text.trim() || loading) return;

		const userMsg: ChatMessage = { role: 'user', content: text };
		setMessages((prev) => [...prev, userMsg]);
		setInput('');
		setLoading(true);

		try {
			const res = await fetch('/api/dataops/catalog-chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: text,
					history: messages.map((m) => ({ role: m.role, content: m.content })),
				}),
			});
			const data = await res.json();
			setMessages((prev) => [
				...prev,
				{ role: 'assistant', content: data.text || 'No response.', datasetCards: data.datasetCards || [] },
			]);
		} catch {
			setMessages((prev) => [
				...prev,
				{ role: 'assistant', content: 'Sorry, something went wrong. Please try again.', datasetCards: [] },
			]);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420, display: 'flex', flexDirection: 'column' } }}>
			<div className="flex items-center justify-between p-3 border-b">
				<div className="flex items-center gap-2">
					<AutoAwesomeIcon color="secondary" fontSize="small" />
					<Typography className="font-semibold">Ask DataVault</Typography>
				</div>
				<IconButton size="small" onClick={onClose}>
					<FuseSvgIcon size={18}>heroicons-outline:x-mark</FuseSvgIcon>
				</IconButton>
			</div>

			{messages.length === 0 && (
				<div className="p-3">
					<Typography variant="caption" color="text.secondary" className="mb-2 block">Suggested queries</Typography>
					<div className="flex flex-wrap gap-1">
						{SUGGESTED_QUERIES.map((q) => (
							<Chip key={q} label={q} size="small" variant="outlined" onClick={() => send(q)} sx={{ fontSize: '0.7rem' }} />
						))}
					</div>
				</div>
			)}

			<div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
				{messages.map((msg, i) => (
					<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
						<Paper
							variant="outlined"
							className="p-2 max-w-[85%]"
							sx={{
								backgroundColor: msg.role === 'user' ? 'primary.main' : 'background.paper',
								color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
							}}
						>
							<Typography variant="body2" className="whitespace-pre-wrap">{msg.content}</Typography>
							{msg.datasetCards && msg.datasetCards.length > 0 && (
								<div className="mt-2 space-y-1">
									{msg.datasetCards.map((dsId) => {
										const ds = catalog.find((c) => c.datasetId === dsId);
										if (!ds) return null;
										return (
											<Paper key={dsId} variant="outlined" className="p-2 flex items-center gap-2">
												<div className="flex-1 min-w-0">
													<Typography variant="caption" className="font-semibold block truncate">{ds.name}</Typography>
													<div className="flex items-center gap-1">
														<Chip label={ds.classification} size="small" sx={{ fontSize: '0.55rem', height: 16 }} />
														<Badge badgeContent={ds.statistics.qualityScore} color={qualityColor(ds.statistics.qualityScore)} sx={{ '& .MuiBadge-badge': { fontSize: '0.55rem', height: 14, minWidth: 20 } }}>
															<span className="pr-3" />
														</Badge>
													</div>
												</div>
												<Button size="small" onClick={() => { onClose(); onOpenDataset(ds); }}>
													Open
												</Button>
											</Paper>
										);
									})}
								</div>
							)}
						</Paper>
					</div>
				))}
				{loading && (
					<div className="flex justify-start">
						<Paper variant="outlined" className="p-2 w-3/4">
							<Skeleton width="80%" />
							<Skeleton width="60%" />
						</Paper>
					</div>
				)}
			</div>

			<div className="p-3 border-t flex gap-2">
				<TextField
					size="small"
					fullWidth
					placeholder="Ask about your data..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
				/>
				<IconButton color="primary" onClick={() => send(input)} disabled={loading || !input.trim()}>
					<FuseSvgIcon size={20}>heroicons-solid:paper-airplane</FuseSvgIcon>
				</IconButton>
			</div>
		</Drawer>
	);
}
