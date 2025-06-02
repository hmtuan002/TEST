import { auth, db, storage } from './firebase.js';

// DOM Elements
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');
const creationContent = document.getElementById('creation-content');
const nextStepBtn = document.getElementById('next-step');
const prevStepBtn = document.getElementById('prev-step');
const createExamBtn = document.getElementById('create-exam');
const previewModal = document.getElementById('preview-modal');
const closePreview = document.getElementById('close-preview');
const previewContent = document.getElementById('preview-content');
const confirmCreate = document.getElementById('confirm-create');
const qrModal = document.getElementById('qr-modal');
const closeQr = document.getElementById('close-qr');
const qrCode = document.getElementById('qr-code');
const examLink = document.getElementById('exam-link');
const copyLink = document.getElementById('copy-link');
const doneBtn = document.getElementById('done-btn');

// Creation methods
const manualCreation = document.getElementById('manual-creation');
const aiCreation = document.getElementById('ai-creation');
const wordImport = document.getElementById('word-import');
const imageImport = document.getElementById('image-import');

// Content sections
const manualContent = document.getElementById('manual-content');
const aiContent = document.getElementById('ai-content');
const wordContent = document.getElementById('word-content');
const imageContent = document.getElementById('image-content');

// Manual creation elements
const questionsContainer = document.getElementById('questions-container');
const addQuestionBtn = document.getElementById('add-question');

// AI creation elements
const generateAiExam = document.getElementById('generate-ai-exam');
const aiPrompt = document.getElementById('ai-prompt');

// Word import elements
const wordFile = document.getElementById('word-file');
const processWord = document.getElementById('process-word');

// Image import elements
const imageFile = document.getElementById('image-file');
const captureImage = document.getElementById('capture-image');
const cameraPreview = document.getElementById('camera-preview');
const cameraView = document.getElementById('camera-view');
const takePhoto = document.getElementById('take-photo');
const capturedImageContainer = document.getElementById('captured-image-container');
const capturedImage = document.getElementById('captured-image');
const processImage = document.getElementById('process-image');

// Exam info
const examTitle = document.getElementById('exam-title');
const examDuration = document.getElementById('exam-duration');
const examDescription = document.getElementById('exam-description');
const antiCheat = document.getElementById('anti-cheat');

// State
let currentStep = 1;
let creationMethod = '';
let examData = {
    title: '',
    duration: 60,
    description: '',
    questions: [],
    antiCheat: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: '',
    examId: ''
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            examData.createdBy = user.uid;
        }
    });

    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Navigation buttons
    nextStepBtn.addEventListener('click', goToNextStep);
    prevStepBtn.addEventListener('click', goToPrevStep);
    createExamBtn.addEventListener('click', showPreview);
    confirmCreate.addEventListener('click', createExam);
    
    // Modal buttons
    closePreview.addEventListener('click', () => previewModal.classList.add('hidden'));
    closeQr.addEventListener('click', () => qrModal.classList.add('hidden'));
    copyLink.addEventListener('click', copyExamLink);
    doneBtn.addEventListener('click', () => window.location.href = 'manage-exam.html'));
    
    // Creation method selection
    manualCreation.addEventListener('click', () => selectCreationMethod('manual'));
    aiCreation.addEventListener('click', () => selectCreationMethod('ai'));
    wordImport.addEventListener('click', () => selectCreationMethod('word'));
    imageImport.addEventListener('click', () => selectCreationMethod('image'));
    
    // Manual creation
    addQuestionBtn.addEventListener('click', addQuestion);
    
    // AI creation
    generateAiExam.addEventListener('click', generateExamWithAI);
    
    // Word import
    processWord.addEventListener('click', processWordFile);
    
    // Image import
    captureImage.addEventListener('click', startCamera);
    takePhoto.addEventListener('click', capturePhoto);
    processImage.addEventListener('click', processImageFile);
    imageFile.addEventListener('change', handleImageUpload);
}

function goToNextStep() {
    if (currentStep === 1) {
        // Validate step 1
        if (!examTitle.value.trim()) {
            alert('Vui lòng nhập tiêu đề đề thi');
            return;
        }
        
        examData.title = examTitle.value.trim();
        examData.duration = parseInt(examDuration.value) || 60;
        examData.description = examDescription.value.trim();
        
        currentStep = 2;
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        prevStepBtn.classList.remove('hidden');
    } 
    else if (currentStep === 2) {
        // Validate step 2
        if (!creationMethod) {
            alert('Vui lòng chọn phương thức tạo đề');
            return;
        }
        
        currentStep = 3;
        step2.classList.add('hidden');
        creationContent.classList.remove('hidden');
        
        // Show the appropriate content based on creation method
        if (creationMethod === 'manual') {
            manualContent.classList.remove('hidden');
            // Add first question by default
            addQuestion();
        } else if (creationMethod === 'ai') {
            aiContent.classList.remove('hidden');
        } else if (creationMethod === 'word') {
            wordContent.classList.remove('hidden');
        } else if (creationMethod === 'image') {
            imageContent.classList.remove('hidden');
        }
    }
    else if (currentStep === 3) {
        // Validate step 3 based on creation method
        if (creationMethod === 'manual' && examData.questions.length === 0) {
            alert('Vui lòng thêm ít nhất một câu hỏi');
            return;
        }
        
        currentStep = 4;
        creationContent.classList.add('hidden');
        step3.classList.remove('hidden');
        nextStepBtn.classList.add('hidden');
        createExamBtn.classList.remove('hidden');
    }
}

function goToPrevStep() {
    if (currentStep === 2) {
        currentStep = 1;
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
        prevStepBtn.classList.add('hidden');
    } 
    else if (currentStep === 3) {
        currentStep = 2;
        creationContent.classList.add('hidden');
        manualContent.classList.add('hidden');
        aiContent.classList.add('hidden');
        wordContent.classList.add('hidden');
        imageContent.classList.add('hidden');
        step2.classList.remove('hidden');
        nextStepBtn.classList.remove('hidden');
    }
    else if (currentStep === 4) {
        currentStep = 3;
        step3.classList.add('hidden');
        creationContent.classList.remove('hidden');
        nextStepBtn.classList.remove('hidden');
        createExamBtn.classList.add('hidden');
    }
}

function selectCreationMethod(method) {
    creationMethod = method;
    
    // Reset all active states
    manualCreation.classList.remove('border-indigo-500', 'ring-2', 'ring-indigo-500');
    aiCreation.classList.remove('border-blue-500', 'ring-2', 'ring-blue-500');
    wordImport.classList.remove('border-green-500', 'ring-2', 'ring-green-500');
    imageImport.classList.remove('border-yellow-500', 'ring-2', 'ring-yellow-500');
    
    // Set active state for selected method
    if (method === 'manual') {
        manualCreation.classList.add('border-indigo-500', 'ring-2', 'ring-indigo-500');
    } else if (method === 'ai') {
        aiCreation.classList.add('border-blue-500', 'ring-2', 'ring-blue-500');
    } else if (method === 'word') {
        wordImport.classList.add('border-green-500', 'ring-2', 'ring-green-500');
    } else if (method === 'image') {
        imageImport.classList.add('border-yellow-500', 'ring-2', 'ring-yellow-500');
    }
}

function addQuestion() {
    const questionId = Date.now();
    const questionHtml = `
        <div class="border rounded-lg p-4" id="question-${questionId}">
            <div class="flex justify-between items-center mb-2">
                <h3 class="font-medium">Câu hỏi ${examData.questions.length + 1}</h3>
                <button class="text-red-500 hover:text-red-700 delete-question" data-id="${questionId}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 mb-1">Nội dung câu hỏi</label>
                <textarea class="w-full px-3 py-2 border rounded question-content" placeholder="Nhập nội dung câu hỏi"></textarea>
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 mb-1">Loại câu hỏi</label>
                <select class="w-full px-3 py-2 border rounded question-type">
                    <option value="multiple-choice">Trắc nghiệm (A, B, C, D)</option>
                    <option value="true-false">Đúng/Sai</option>
                    <option value="short-answer">Trả lời ngắn</option>
                    <option value="essay">Tự luận</option>
                </select>
            </div>
            <div class="question-options space-y-2">
                <!-- Options will be generated based on question type -->
            </div>
        </div>
    `;
    
    questionsContainer.insertAdjacentHTML('beforeend', questionHtml);
    
    // Add event listeners to the new question
    const questionElement = document.getElementById(`question-${questionId}`);
    const deleteBtn = questionElement.querySelector('.delete-question');
    const typeSelect = questionElement.querySelector('.question-type');
    
    deleteBtn.addEventListener('click', () => deleteQuestion(questionId));
    typeSelect.addEventListener('change', (e) => updateQuestionOptions(questionId, e.target.value));
    
    // Initialize options for the first time
    updateQuestionOptions(questionId, 'multiple-choice');
    
    // Add to exam data
    examData.questions.push({
        id: questionId,
        content: '',
        type: 'multiple-choice',
        options: [],
        correctAnswer: ''
    });
}

function deleteQuestion(id) {
    const questionElement = document.getElementById(`question-${id}`);
    questionElement.remove();
    
    // Remove from exam data
    examData.questions = examData.questions.filter(q => q.id !== id);
    
    // Update question numbers
    const questions = questionsContainer.querySelectorAll('[id^="question-"]');
    questions.forEach((q, index) => {
        const questionTitle = q.querySelector('h3');
        if (questionTitle) {
            questionTitle.textContent = `Câu hỏi ${index + 1}`;
        }
    });
}

function updateQuestionOptions(questionId, type) {
    const questionElement = document.getElementById(`question-${questionId}`);
    const optionsContainer = questionElement.querySelector('.question-options');
    
    // Update question type in exam data
    const questionIndex = examData.questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
        examData.questions[questionIndex].type = type;
    }
    
    // Clear existing options
    optionsContainer.innerHTML = '';
    
    if (type === 'multiple-choice') {
        optionsContainer.innerHTML = `
            <div class="mb-2">
                <label class="block text-gray-700 mb-1">Tùy chọn A</label>
                <div class="flex">
                    <input type="text" class="flex-grow px-3 py-2 border rounded option-value" data-option="a" placeholder="Nhập tùy chọn A">
                    <label class="ml-2 flex items-center">
                        <input type="radio" name="correct-${questionId}" value="a" class="mr-1 correct-option">
                        Đúng
                    </label>
                </div>
            </div>
            <div class="mb-2">
                <label class="block text-gray-700 mb-1">Tùy chọn B</label>
                <div class="flex">
                    <input type="text" class="flex-grow px-3 py-2 border rounded option-value" data-option="b" placeholder="Nhập tùy chọn B">
                    <label class="ml-2 flex items-center">
                        <input type="radio" name="correct-${questionId}" value="b" class="mr-1 correct-option">
                        Đúng
                    </label>
                </div>
            </div>
            <div class="mb-2">
                <label class="block text-gray-700 mb-1">Tùy chọn C</label>
                <div class="flex">
                    <input type="text" class="flex-grow px-3 py-2 border rounded option-value" data-option="c" placeholder="Nhập tùy chọn C">
                    <label class="ml-2 flex items-center">
                        <input type="radio" name="correct-${questionId}" value="c" class="mr-1 correct-option">
                        Đúng
                    </label>
                </div>
            </div>
            <div class="mb-2">
                <label class="block text-gray-700 mb-1">Tùy chọn D</label>
                <div class="flex">
                    <input type="text" class="flex-grow px-3 py-2 border rounded option-value" data-option="d" placeholder="Nhập tùy chọn D">
                    <label class="ml-2 flex items-center">
                        <input type="radio" name="correct-${questionId}" value="d" class="mr-1 correct-option">
                        Đúng
                    </label>
                </div>
            </div>
        `;
        
        // Initialize options in exam data
        if (questionIndex !== -1) {
            examData.questions[questionIndex].options = [
                { option: 'a', value: '' },
                { option: 'b', value: '' },
                { option: 'c', value: '' },
                { option: 'd', value: '' }
            ];
            examData.questions[questionIndex].correctAnswer = '';
        }
        
        // Add event listeners for options
        const optionInputs = optionsContainer.querySelectorAll('.option-value');
        const correctOptions = optionsContainer.querySelectorAll('.correct-option');
        
        optionInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const option = e.target.dataset.option;
                if (questionIndex !== -1) {
                    const optionIndex = examData.questions[questionIndex].options.findIndex(o => o.option === option);
                    if (optionIndex !== -1) {
                        examData.questions[questionIndex].options[optionIndex].value = e.target.value;
                    }
                }
            });
        });
        
        correctOptions.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && questionIndex !== -1) {
                    examData.questions[questionIndex].correctAnswer = e.target.value;
                }
            });
        });
    }
    else if (type === 'true-false') {
        optionsContainer.innerHTML = `
            <div class="flex space-x-4">
                <label class="flex items-center">
                    <input type="radio" name="correct-${questionId}" value="true" class="mr-2 correct-option">
                    Đúng
                </label>
                <label class="flex items-center">
                    <input type="radio" name="correct-${questionId}" value="false" class="mr-2 correct-option">
                    Sai
                </label>
            </div>
        `;
        
        // Initialize in exam data
        if (questionIndex !== -1) {
            examData.questions[questionIndex].options = [];
            examData.questions[questionIndex].correctAnswer = '';
        }
        
        // Add event listeners
        const correctOptions = optionsContainer.querySelectorAll('.correct-option');
        correctOptions.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && questionIndex !== -1) {
                    examData.questions[questionIndex].correctAnswer = e.target.value;
                }
            });
        });
    }
    else if (type === 'short-answer' || type === 'essay') {
        optionsContainer.innerHTML = `
            <div>
                <label class="block text-gray-700 mb-1">Đáp án mẫu</label>
                <textarea class="w-full px-3 py-2 border rounded correct-answer" placeholder="Nhập đáp án mẫu (nếu có)"></textarea>
            </div>
        `;
        
        // Initialize in exam data
        if (questionIndex !== -1) {
            examData.questions[questionIndex].options = [];
            examData.questions[questionIndex].correctAnswer = '';
        }
        
        // Add event listener
        const correctAnswer = optionsContainer.querySelector('.correct-answer');
        correctAnswer.addEventListener('input', (e) => {
            if (questionIndex !== -1) {
                examData.questions[questionIndex].correctAnswer = e.target.value;
            }
        });
    }
    
    // Add event listener for question content
    const questionContent = questionElement.querySelector('.question-content');
    questionContent.addEventListener('input', (e) => {
        if (questionIndex !== -1) {
            examData.questions[questionIndex].content = e.target.value;
        }
    });
}

function generateExamWithAI() {
    if (!aiPrompt.value.trim()) {
        alert('Vui lòng nhập mô tả đề thi cho AI');
        return;
    }
    
    // Simulate AI generation (in a real app, this would call an API)
    alert('Tính năng tạo đề bằng AI đang được phát triển. Vui lòng sử dụng phương thức tạo thủ công.');
    
    // In a real implementation, you would:
    // 1. Call your AI API with the prompt
    // 2. Process the response into examData format
    // 3. Show the preview
}

function processWordFile() {
    if (!wordFile.files || wordFile.files.length === 0) {
        alert('Vui lòng chọn file Word');
        return;
    }
    
    // Simulate Word processing (in a real app, this would call an API)
    alert('Tính năng nhập đề từ file Word đang được phát triển. Vui lòng sử dụng phương thức tạo thủ công.');
}

function startCamera() {
    cameraPreview.classList.remove('hidden');
    capturedImageContainer.classList.add('hidden');
    
    // In a real app, you would access the device camera
    alert('Tính năng chụp ảnh đang được phát triển. Vui lòng tải lên hình ảnh từ thiết bị.');
}

function capturePhoto() {
    // In a real app, you would capture the current frame from the camera
    alert('Tính năng chụp ảnh đang được phát triển. Vui lòng tải lên hình ảnh từ thiết bị.');
    
    // Simulate photo capture
    cameraPreview.classList.add('hidden');
    capturedImageContainer.classList.remove('hidden');
    capturedImage.src = 'https://via.placeholder.com/800x600';
}

function handleImageUpload(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            capturedImage.src = event.target.result;
            capturedImageContainer.classList.remove('hidden');
            cameraPreview.classList.add('hidden');
        };
        reader.readAsDataURL(e.target.files[0]);
    }
}

function processImageFile() {
    if (!imageFile.files || imageFile.files.length === 0) {
        alert('Vui lòng chọn hình ảnh hoặc chụp ảnh đề thi');
        return;
    }
    
    // Simulate image processing (in a real app, this would call an API)
    alert('Tính năng nhập đề từ hình ảnh đang được phát triển. Vui lòng sử dụng phương thức tạo thủ công.');
}

function showPreview() {
    // Update anti-cheat setting
    examData.antiCheat = antiCheat.checked;
    
    // Generate preview HTML
    let previewHtml = `
        <h3 class="text-xl font-bold mb-2">${examData.title}</h3>
        <p class="text-gray-600 mb-4">${examData.description}</p>
        <div class="space-y-6">
    `;
    
    examData.questions.forEach((question, index) => {
        previewHtml += `
            <div class="border-b pb-4">
                <h4 class="font-medium mb-2">Câu ${index + 1}: ${question.content}</h4>
        `;
        
        if (question.type === 'multiple-choice') {
            previewHtml += `<div class="space-y-2 ml-4">`;
            question.options.forEach(opt => {
                previewHtml += `
                    <div class="flex items-center">
                        <span class="font-medium mr-2">${opt.option.toUpperCase()}:</span>
                        <span>${opt.value}</span>
                        ${question.correctAnswer === opt.option ? '<span class="ml-2 text-green-600"><i class="fas fa-check"></i></span>' : ''}
                    </div>
                `;
            });
            previewHtml += `</div>`;
        }
        else if (question.type === 'true-false') {
            previewHtml += `
                <div class="ml-4">
                    <div class="flex items-center">
                        <span class="font-medium mr-2">Đáp án:</span>
                        <span>${question.correctAnswer === 'true' ? 'Đúng' : 'Sai'}</span>
                    </div>
                </div>
            `;
        }
        else if (question.type === 'short-answer' || question.type === 'essay') {
            previewHtml += `
                <div class="ml-4">
                    <div class="font-medium mb-1">Đáp án mẫu:</div>
                    <div class="bg-gray-50 p-2 rounded">${question.correctAnswer || 'Không có đáp án mẫu'}</div>
                </div>
            `;
        }
        
        previewHtml += `</div>`;
    });
    
    previewHtml += `</div>`;
    previewContent.innerHTML = previewHtml;
    
    // Show preview modal
    previewModal.classList.remove('hidden');
}

async function createExam() {
    // Generate exam ID
    examData.examId = generateExamId();
    
    try {
        // Save to Firestore
        await db.collection('exams').doc(examData.examId).set(examData);
        
        // Generate shareable link
        const examLinkValue = `${window.location.origin}/take-exam.html?examId=${examData.examId}`;
        examLink.value = examLinkValue;
        
        // Generate QR code
        qrCode.innerHTML = '';
        QRCode.toCanvas(qrCode, examLinkValue, { width: 200 }, (error) => {
            if (error) console.error('QR code generation error:', error);
        });
        
        // Hide preview and show QR modal
        previewModal.classList.add('hidden');
        qrModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error creating exam:', error);
        alert('Có lỗi xảy ra khi tạo đề thi. Vui lòng thử lại.');
    }
}

function generateExamId() {
    return 'exam-' + Math.random().toString(36).substr(2, 9);
}

function copyExamLink() {
    examLink.select();
    document.execCommand('copy');
    alert('Đã sao chép link vào clipboard');
}