'use client';

import { useState, useRef, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import type { Truck, ChatMessage } from './types';

interface AskTheYardDrawerProps {
	yardTrucks: Truck[];
	dockedTrucks: Truck[];
	fcId: string;
}

const SEED_QUESTIONS = [
	'Which truck should go to the next available door?',
	'How many HOT shipments are waiting?',
	'Which docked truck frees up soonest?',
];

interface ChatEntry {
	message: ChatMessage;
	responseTime?: number;
}

/**
 * Ask the Yard — collapsible chat drawer that slides over content from the right.
 * Provides conversational access to yard and dock state via LLM.
 */
function AskTheYardDrawer({ yardTrucks, dockedTrucks, fcId }: AskTheYardDrawerProps) {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState('');
	const [entries, setEntries] = useState<ChatEntry[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [entries, loading]);

	const sendMessage = async (text: string) => {
		if (!text.trim() || loading) return;

		const userEntry: ChatEntry = { message: { role: 'user', content: text.trim() } };
		setEntries((prev) => [...prev, userEntry]);
		setInput('');
		setLoading(true);
		setError(false);

		const history: ChatMessage[] = entries.map((e) => e.message);
		const start = Date.now();

		try {
			const res = await fetch('/api/inboundiq/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: text.trim(),
					history,
					yardTrucks,
					dockedTrucks,
					fcId,
				}),
			});

			if (!res.ok) throw new Error('Failed');
			const data = await res.json();
			const elapsed = Date.now() - start;

			setEntries((prev) => [
				...prev,
				{ message: { role: 'assistant', content: data.result }, responseTime: elapsed },
			]);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage(input);
		}
	};

	return (
		<>
			{/* Floating trigger button */}
			<Fab
				size="medium"
				color="primary"
				onClick={() => setOpen(true)}
				sx={{
					position: 'fixed',
					bottom: 24,
					right: 460,
					zIndex: 1200,
				}}
				title="Ask the Yard ✦"
			>
				<AutoAwesomeIcon />
			</Fab>

			{/* Chat drawer */}
			<Drawer
				anchor="right"
				open={open}
				onClose={() => setOpen(false)}
				variant="temporary"
				slotProps={{
					paper: {
						sx: {
							width: 380,
							display: 'flex',
							flexDirection: 'column',
						},
					},
					backdrop: { sx: { backgroundColor: 'transparent' } },
				}}
			>
				{/* Header */}
				<Box
					className="flex items-center justify-between p-4"
					sx={{ borderBottom: 1, borderColor: 'divider' }}
				>
					<Box className="flex items-center gap-1">
						<AutoAwesomeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
						<Typography variant="subtitle1" className="font-bold">
							Ask the Yard
						</Typography>
						<Typography variant="caption" sx={{ color: 'primary.main', ml: 0.5 }}>
							AI-Enhanced ✦
						</Typography>
					</Box>
					<IconButton size="small" onClick={() => setOpen(false)}>
						<CloseIcon />
					</IconButton>
				</Box>

				{/* Messages area */}
				<Box className="flex-1 overflow-auto p-4 flex flex-col gap-3">
					{entries.length === 0 && !loading && (
						<Box className="flex flex-col gap-2 mt-4">
							<Typography variant="body2" color="text.secondary" className="mb-2">
								Ask anything about the {fcId} yard queue and dock status.
							</Typography>
							{SEED_QUESTIONS.map((q) => (
								<Chip
									key={q}
									label={q}
									variant="outlined"
									onClick={() => sendMessage(q)}
									sx={{ justifyContent: 'flex-start', height: 'auto', py: 1, whiteSpace: 'normal' }}
								/>
							))}
						</Box>
					)}

					{entries.map((entry, i) => (
						<Box
							key={i}
							className={`flex ${entry.message.role === 'user' ? 'justify-end' : 'justify-start'}`}
						>
							<Paper
								elevation={0}
								sx={{
									p: 1.5,
									maxWidth: '85%',
									backgroundColor:
										entry.message.role === 'user'
											? 'primary.main'
											: 'action.hover',
									color: entry.message.role === 'user' ? 'primary.contrastText' : 'text.primary',
									borderRadius: 2,
								}}
							>
								<Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
									{entry.message.content}
								</Typography>
								{entry.responseTime !== undefined && (
									<Typography
										variant="caption"
										sx={{
											opacity: 0.6,
											display: 'block',
											mt: 0.5,
											textAlign: 'right',
										}}
									>
										{(entry.responseTime / 1000).toFixed(1)}s
									</Typography>
								)}
							</Paper>
						</Box>
					))}

					{loading && (
						<Box className="flex justify-start">
							<Paper
								elevation={0}
								sx={{ p: 1.5, maxWidth: '85%', backgroundColor: 'action.hover', borderRadius: 2 }}
							>
								<Skeleton variant="text" width={200} />
								<Skeleton variant="text" width={160} />
							</Paper>
						</Box>
					)}

					{error && (
						<Box className="flex justify-start">
							<Paper
								elevation={0}
								sx={{ p: 1.5, backgroundColor: 'error.main', color: 'error.contrastText', borderRadius: 2 }}
							>
								<Typography variant="body2" className="mb-1">
									Failed to get response
								</Typography>
								<Button
									size="small"
									variant="outlined"
									sx={{ color: 'inherit', borderColor: 'inherit' }}
									onClick={() => {
										const lastUser = [...entries].reverse().find((e) => e.message.role === 'user');
										if (lastUser) sendMessage(lastUser.message.content);
									}}
								>
									Retry
								</Button>
							</Paper>
						</Box>
					)}

					<div ref={messagesEndRef} />
				</Box>

				{/* Input */}
				<Box className="p-3" sx={{ borderTop: 1, borderColor: 'divider' }}>
					<TextField
						fullWidth
						size="small"
						placeholder="Ask about the yard..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={loading}
						multiline
						maxRows={3}
						slotProps={{
							input: {
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											size="small"
											onClick={() => sendMessage(input)}
											disabled={!input.trim() || loading}
											color="primary"
										>
											<SendIcon fontSize="small" />
										</IconButton>
									</InputAdornment>
								),
							},
						}}
					/>
				</Box>
			</Drawer>
		</>
	);
}

export default AskTheYardDrawer;
