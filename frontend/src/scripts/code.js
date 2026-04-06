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
const copyBtn = document.getElementById('copyBtn');

const iconCopy = document.getElementById('iconCopy');
const iconCheck = document.getElementById('iconCheck');

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
		return;
	}

	statusText.textContent = 'Generating...';
	submittedOutput.textContent = '';
	reasoningOutput.textContent = '';

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

		submittedOutput.textContent = data.output || '';
		reasoningOutput.textContent = data.reasoning || '';
		statusText.textContent = 'Done';
		copyBtn.disabled = !data.output;
	} catch (error) {
		statusText.textContent = 'Could not connect to backend.';
	}
});

function setContext(text) {
	document.getElementById('contextInput').value = text;
}
