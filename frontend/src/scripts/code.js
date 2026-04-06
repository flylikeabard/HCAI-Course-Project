const textForm = document.getElementById('textForm');
const messageInput = document.getElementById('messageInput');
const contextInput = document.getElementById('contextInput');
const statusText = document.getElementById('statusText');
const submittedOutput = document.getElementById('submittedOutput');
const reasoningOutput = document.getElementById('reasoningOutput');

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
	} catch (error) {
		statusText.textContent = 'Could not connect to backend.';
	}
});
// Function to fill Context Box when a button is clicked
function setContext(text) {
    document.getElementById('contextInput').value = text;
}