const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

settingsBtn.addEventListener('click', () => {
	settingsModal.hidden = false;
});

closeSettingsBtn.addEventListener('click', () => {
	settingsModal.hidden = true;
});

saveSettingsBtn.addEventListener('click', () => {
	settingsModal.hidden = true;
});

settingsModal.addEventListener('click', (e) => {
	if (e.target === settingsModal) settingsModal.hidden = true;
});

const textForm = document.getElementById('textForm');
const messageInput = document.getElementById('messageInput');
const contextInput = document.getElementById('contextInput');
const statusText = document.getElementById('statusText');
const submittedOutput = document.getElementById('submittedOutput');
const reasoningOutput = document.getElementById('reasoningOutput');
const pageContainer = document.querySelector('.container');
const submitBtn = textForm.querySelector('button[type="submit"]');
const presetButtons = Array.from(document.querySelectorAll('.preset-btn'));
const copyBtn = document.getElementById('copyBtn');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const historyNav = document.getElementById('historyNav');
const historyPrevBtn = document.getElementById('historyPrevBtn');
const historyNextBtn = document.getElementById('historyNextBtn');
const historyBackBtn = document.getElementById('historyBackBtn');
const historyCounter = document.getElementById('historyCounter');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const iconCopy = document.getElementById('iconCopy');
const iconCheck = document.getElementById('iconCheck');

const sessionHistory = [];
let isHistoryMode = false;
let historyIndex = -1;
let draftBeforeHistory = null;

function setStatus(message, type = 'info') {
	statusText.textContent = message;
	statusText.classList.remove('status--info', 'status--success', 'status--error', 'status--loading');
	if (message) {
		statusText.classList.add(`status--${type}`);
	}
}

function setOutputContent(element, text) {
	const safeText = text || '';
	element.textContent = safeText;
	element.classList.toggle('is-empty', safeText.trim().length === 0);
}

// Load history from sessionStorage on page init
function loadHistoryFromStorage() {
	try {
		const stored = sessionStorage.getItem('emailHistoryData');
		if (stored) {
			const parsed = JSON.parse(stored);
			sessionHistory.push(...parsed);
		}
	} catch (error) {
		console.error('Failed to load history from sessionStorage:', error);
	}
}

// Save history to sessionStorage
function saveHistoryToStorage() {
	try {
		sessionStorage.setItem('emailHistoryData', JSON.stringify(sessionHistory));
	} catch (error) {
		console.error('Failed to save history to sessionStorage:', error);
	}
}

// Load on page init
loadHistoryFromStorage();
updateHistoryControls();

function setInputReadOnlyState(readOnly) {
	messageInput.readOnly = readOnly;
	contextInput.readOnly = readOnly;
	submitBtn.disabled = readOnly;
	presetButtons.forEach((button) => {
		button.disabled = readOnly;
	});
}

function updateHistoryControls() {
	historyNav.hidden = !isHistoryMode;
	historyToggleBtn.hidden = isHistoryMode;

	if (!isHistoryMode) {
		historyCounter.textContent = '0/0';
		pageContainer.classList.remove('history-active');
		return;
	}

	historyCounter.textContent = `${historyIndex + 1}/${sessionHistory.length}`;
	historyPrevBtn.disabled = historyIndex <= 0;
	historyNextBtn.disabled = historyIndex >= sessionHistory.length - 1;
	pageContainer.classList.add('history-active');
}

function renderLatestSuggestion() {
	if (sessionHistory.length === 0) {
		setOutputContent(submittedOutput, '');
		setOutputContent(reasoningOutput, '');
		copyBtn.disabled = true;
		return;
	}

	const latest = sessionHistory[sessionHistory.length - 1];
	setOutputContent(submittedOutput, latest.output);
	setOutputContent(reasoningOutput, latest.reasoning);
	copyBtn.disabled = !latest.output;
}

function renderHistoryEntry() {
	const entry = sessionHistory[historyIndex];
	if (!entry) {
		return;
	}

	setOutputContent(submittedOutput, entry.output);
	setOutputContent(reasoningOutput, entry.reasoning);
	messageInput.value = entry.prompt;
	contextInput.value = entry.context;
	copyBtn.disabled = !entry.output;
	updateHistoryControls();
}

function enterHistoryMode() {
	if (sessionHistory.length === 0) {
		setStatus('No history in this session yet. Generate at least one draft first.', 'info');
		return;
	}

	draftBeforeHistory = {
		prompt: messageInput.value,
		context: contextInput.value,
	};
	isHistoryMode = true;
	setInputReadOnlyState(true);
	historyIndex = sessionHistory.length - 1;
	renderHistoryEntry();
}

function exitHistoryMode() {
	isHistoryMode = false;
	historyIndex = -1;
	setInputReadOnlyState(false);
	const hasDraftContent = draftBeforeHistory
		&& (draftBeforeHistory.prompt.trim().length > 0 || draftBeforeHistory.context.trim().length > 0);

	if (hasDraftContent) {
		messageInput.value = draftBeforeHistory.prompt;
		contextInput.value = draftBeforeHistory.context;
	} else if (sessionHistory.length > 0) {
		const latest = sessionHistory[sessionHistory.length - 1];
		messageInput.value = latest.prompt || '';
		contextInput.value = latest.context || '';
	}
	draftBeforeHistory = null;
	renderLatestSuggestion();
	if (sessionHistory.length > 0) {
		setStatus('Showing latest suggestion.', 'info');
	}
	updateHistoryControls();
}

historyToggleBtn.addEventListener('click', () => {
	enterHistoryMode();
});

historyBackBtn.addEventListener('click', () => {
	exitHistoryMode();
});

historyPrevBtn.addEventListener('click', () => {
	if (historyIndex <= 0) {
		return;
	}
	historyIndex -= 1;
	renderHistoryEntry();
});

historyNextBtn.addEventListener('click', () => {
	if (historyIndex >= sessionHistory.length - 1) {
		return;
	}
	historyIndex += 1;
	renderHistoryEntry();
});

clearHistoryBtn.addEventListener('click', () => {
	sessionHistory.length = 0;
	saveHistoryToStorage();
	exitHistoryMode();
	setStatus('History cleared.', 'info');
	updateHistoryControls();
});

updateHistoryControls();

copyBtn.addEventListener('click', () => {
	navigator.clipboard.writeText(submittedOutput.textContent).then(() => {
		iconCopy.style.display = 'none';
		iconCheck.style.display = 'block';
		copyBtn.classList.add('copied');
		setTimeout(() => {
			iconCopy.style.display = 'block';
			iconCheck.style.display = 'none';
			copyBtn.classList.remove('copied');
		}, 2000);
	});
});

const apiBaseUrl = 'http://127.0.0.1:8000';

textForm.addEventListener('submit', async (event) => {
	event.preventDefault();

	const promptText = messageInput.value.trim();
	const contextText = contextInput.value.trim();

	if (!promptText) {
		setStatus('Please write something before submitting.', 'error');
		setOutputContent(submittedOutput, '');
		setOutputContent(reasoningOutput, '');
		copyBtn.disabled = true;
		return;
	}

	if (isHistoryMode) {
		exitHistoryMode();
	}

	setStatus('Generating draft...', 'loading');
	setOutputContent(submittedOutput, '');
	setOutputContent(reasoningOutput, '');
	copyBtn.disabled = true;

	// Disable all interactive buttons during API call
	submitBtn.disabled = true;
	historyToggleBtn.disabled = true;
	historyPrevBtn.disabled = true;
	historyNextBtn.disabled = true;
	clearHistoryBtn.disabled = true;
	presetButtons.forEach((button) => {
		button.disabled = true;
	});

	try {
		const response = await fetch(`${apiBaseUrl}/api/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				prompt: promptText,
				context: contextText,
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			setStatus(data.detail || 'Could not generate draft. Please try again.', 'error');
			// Re-enable buttons on error
			submitBtn.disabled = false;
			historyToggleBtn.disabled = false;
			clearHistoryBtn.disabled = false;
			presetButtons.forEach((button) => {
				button.disabled = false;
			});
			updateHistoryControls();
			return;
		}

		const historyItem = {
			output: data.output || '',
			reasoning: data.reasoning || '',
			prompt: promptText,
			context: contextText,
			timestamp: new Date().toISOString(),
		};

		sessionHistory.push(historyItem);
		saveHistoryToStorage();
		setOutputContent(submittedOutput, historyItem.output);
		setOutputContent(reasoningOutput, historyItem.reasoning);
		setStatus('Draft generated successfully.', 'success');
		copyBtn.disabled = !historyItem.output;
		// Re-enable buttons after successful generation
		submitBtn.disabled = false;
		historyToggleBtn.disabled = false;
		clearHistoryBtn.disabled = false;
		presetButtons.forEach((button) => {
			button.disabled = false;
		});
		updateHistoryControls();
	} catch (error) {
		setStatus('Could not connect to backend. Check that the API server is running.', 'error');
		// Re-enable buttons on error
		submitBtn.disabled = false;
		historyToggleBtn.disabled = false;
		clearHistoryBtn.disabled = false;
		presetButtons.forEach((button) => {
			button.disabled = false;
		});
		updateHistoryControls();
	}
});

function setContext(text) {
	if (isHistoryMode) {
		return;
	}
	document.getElementById('contextInput').value = text;
}
