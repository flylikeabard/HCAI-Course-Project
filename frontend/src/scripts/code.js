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

const iconCopy = document.getElementById('iconCopy');
const iconCheck = document.getElementById('iconCheck');

const sessionHistory = [];
let isHistoryMode = false;
let historyIndex = -1;
let draftBeforeHistory = null;

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
		submittedOutput.textContent = '';
		reasoningOutput.textContent = '';
		copyBtn.disabled = true;
		return;
	}

	const latest = sessionHistory[sessionHistory.length - 1];
	submittedOutput.textContent = latest.output;
	reasoningOutput.textContent = latest.reasoning;
	copyBtn.disabled = !latest.output;
}

function renderHistoryEntry() {
	const entry = sessionHistory[historyIndex];
	if (!entry) {
		return;
	}

	submittedOutput.textContent = entry.output;
	reasoningOutput.textContent = entry.reasoning;
	messageInput.value = entry.prompt;
	contextInput.value = entry.context;
	copyBtn.disabled = !entry.output;
	updateHistoryControls();
}

function enterHistoryMode() {
	if (sessionHistory.length === 0) {
		statusText.textContent = 'No history in this session yet.';
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
	if (draftBeforeHistory) {
		messageInput.value = draftBeforeHistory.prompt;
		contextInput.value = draftBeforeHistory.context;
	}
	draftBeforeHistory = null;
	renderLatestSuggestion();
	statusText.textContent = sessionHistory.length > 0 ? 'Showing latest suggestion.' : statusText.textContent;
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
		statusText.textContent = 'Please write something before submitting.';
		submittedOutput.textContent = '';
		reasoningOutput.textContent = '';
		copyBtn.disabled = true;
		return;
	}

	if (isHistoryMode) {
		exitHistoryMode();
	}

	statusText.textContent = 'Generating...';
	submittedOutput.textContent = '';
	reasoningOutput.textContent = '';
	copyBtn.disabled = true;

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
			statusText.textContent = data.detail || 'Something went wrong.';
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
		submittedOutput.textContent = historyItem.output;
		reasoningOutput.textContent = historyItem.reasoning;
		statusText.textContent = 'Done';
		copyBtn.disabled = !historyItem.output;
		updateHistoryControls();
	} catch (error) {
		statusText.textContent = 'Could not connect to backend.';
	}
});

function setContext(text) {
	if (isHistoryMode) {
		return;
	}
	document.getElementById('contextInput').value = text;
}
