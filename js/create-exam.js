document.addEventListener('DOMContentLoaded', function() {
    // Biến toàn cục
    let currentStep = 1;
    let examMethod = 'manual';
    let examData = {
        name: '',
        duration: 120,
        description: '',
        questions: [],
        antiCheat: {
            preventCopy: false,
            preventTabSwitch: false,
            notifyCheating: false
        },
        createdAt: new Date()
    };
    
    // DOM Elements
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const examPreview = document.getElementById('exam-preview');
    const examResult = document.getElementById('exam-result');
    
    // Bước 1: Cài đặt cơ bản
    document.getElementById('next-to-step-2').addEventListener('click', function() {
        const examName = document.getElementById('exam-name').value.trim();
        const examDuration = parseInt(document.getElementById('exam-duration').value);
        const examDescription = document.getElementById('exam-description').value.trim();
        
        if (!examName) {
            alert('Vui lòng nhập tên đề thi');
            return;
        }
        
        if (isNaN(examDuration) || examDuration <= 0) {
            alert('Vui lòng nhập thời gian làm bài hợp lệ');
            return;
        }
        
        examData.name = examName;
        examData.duration = examDuration;
        examData.description = examDescription;
        
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        currentStep = 2;
    });
    
    // Chọn phương thức tạo đề
    const methodButtons = ['manual', 'ai', 'word', 'image'];
    methodButtons.forEach(method => {
        document.getElementById(`${method}-method`).addEventListener('click', function() {
            // Xóa active class từ tất cả các nút
            methodButtons.forEach(m => {
                document.getElementById(`${m}-method`).classList.remove('active');
                document.getElementById(`${m}-content`).classList.add('hidden');
            });
            
            // Thêm active class cho nút được chọn
            this.classList.add('active');
            document.getElementById(`${method}-content`).classList.remove('hidden');
            examMethod = method;
        });
    });
    
    // Thêm câu hỏi thủ công
    document.getElementById('add-multiple-choice').addEventListener('click', addMultipleChoiceQuestion);
    document.getElementById('add-true-false').addEventListener('click', addTrueFalseQuestion);
    document.getElementById('add-short-answer').addEventListener('click', addShortAnswerQuestion);
    document.getElementById('add-essay').addEventListener('click', addEssayQuestion);
    
    // Bước 2: Tiếp tục
    document.getElementById('next-to-step-3').addEventListener('click', function() {
        if (examMethod === 'manual' && examData.questions.length === 0) {
            alert('Vui lòng thêm ít nhất một câu hỏi');
            return;
        }
        
        step2.classList.add('hidden');
        step3.classList.remove('hidden');
        currentStep = 3;
    });
    
    // Quay lại bước 1
    document.getElementById('back-to-step-1').addEventListener('click', function() {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
        currentStep = 1;
    });
    
    // Bước 3: Tạo đề thi
    document.getElementById('create-exam').addEventListener('click', function() {
        examData.antiCheat.preventCopy = document.getElementById('prevent-copy').checked;
        examData.antiCheat.preventTabSwitch = document.getElementById('prevent-tab-switch').checked;
        examData.antiCheat.notifyCheating = document.getElementById('notify-cheating').checked;
        
        // Hiển thị preview
        previewExam();
        
        step3.classList.add('hidden');
        examPreview.classList.remove('hidden');
    });
    
    // Quay lại bước 2
    document.getElementById('back-to-step-2').addEventListener('click', function() {
        step3.classList.add('hidden');
        step2.classList.remove('hidden');
        currentStep = 2;
    });
    
    // Chỉnh sửa đề thi
    document.getElementById('edit-exam').addEventListener('click', function() {
        examPreview.classList.add('hidden');
        step3.classList.remove('hidden');
    });
    
    // Lưu đề thi
    document.getElementById('save-exam').addEventListener('click', saveExam);
    
    // Các hàm hỗ trợ
    function addMultipleChoiceQuestion() {
        const questionId = Date.now();
        const questionHtml = `
            <div class="question-card" data-id="${questionId}" data-type="multiple-choice">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-medium">Câu hỏi trắc nghiệm</h4>
                    <button class="delete-question text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Nội dung câu hỏi</label>
                    <textarea class="question-content w-full p-2 border rounded" placeholder="Nhập nội dung câu hỏi..."></textarea>
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Đáp án</label>
                    <div class="space-y-2">
                        <div class="flex items-center">
                            <input type="radio" name="correct-answer-${questionId}" value="A" class="mr-2">
                            <input type="text" class="answer-option w-full p-2 border rounded" placeholder="Đáp án A">
                        </div>
                        <div class="flex items-center">
                            <input type="radio" name="correct-answer-${questionId}" value="B" class="mr-2">
                            <input type="text" class="answer-option w-full p-2 border rounded" placeholder="Đáp án B">
                        </div>
                        <div class="flex items-center">
                            <input type="radio" name="correct-answer-${questionId}" value="C" class="mr-2">
                            <input type="text" class="answer-option w-full p-2 border rounded" placeholder="Đáp án C">
                        </div>
                        <div class="flex items-center">
                            <input type="radio" name="correct-answer-${questionId}" value="D" class="mr-2">
                            <input type="text" class="answer-option w-full p-2 border rounded" placeholder="Đáp án D">
                        </div>
                    </div>
                </div>
                <button class="add-option btn-secondary-sm mt-2">
                    <i class="fas fa-plus mr-1"></i> Thêm lựa chọn
                </button>
            </div>
        `;
        
        document.getElementById('questions-container').insertAdjacentHTML('beforeend', questionHtml);
        
        // Thêm sự kiện cho nút xóa
        document.querySelector(`[data-id="${questionId}"] .delete-question`).addEventListener('click', function() {
            this.closest('.question-card').remove();
        });
        
        // Thêm sự kiện cho nút thêm lựa chọn
        document.querySelector(`[data-id="${questionId}"] .add-option`).addEventListener('click', function() {
            const optionsContainer = this.previousElementSibling.querySelector('.space-y-2');
            const optionCount = optionsContainer.children.length;
            const nextOption = String.fromCharCode(65 + optionCount);
            
            const optionHtml = `
                <div class="flex items-center">
                    <input type="radio" name="correct-answer-${questionId}" value="${nextOption}" class="mr-2">
                    <input type="text" class="answer-option w-full p-2 border rounded" placeholder="Đáp án ${nextOption}">
                </div>
            `;
            
            optionsContainer.insertAdjacentHTML('beforeend', optionHtml);
            
            // Nếu đã có 8 lựa chọn thì ẩn nút thêm
            if (optionCount >= 7) {
                this.style.display = 'none';
            }
        });
    }
    
    function addTrueFalseQuestion() {
        const questionId = Date.now();
        const questionHtml = `
            <div class="question-card" data-id="${questionId}" data-type="true-false">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-medium">Câu hỏi Đúng/Sai</h4>
                    <button class="delete-question text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Nội dung câu hỏi</label>
                    <textarea class="question-content w-full p-2 border rounded" placeholder="Nhập nội dung câu hỏi..."></textarea>
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Đáp án đúng</label>
                    <div class="flex space-x-4">
                        <label class="flex items-center">
                            <input type="radio" name="correct-answer-${questionId}" value="true" class="mr-2">
                            <span>Đúng</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="correct-answer-${questionId}" value="false" class="mr-2">
                            <span>Sai</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('questions-container').insertAdjacentHTML('beforeend', questionHtml);
        
        // Thêm sự kiện cho nút xóa
        document.querySelector(`[data-id="${questionId}"] .delete-question`).addEventListener('click', function() {
            this.closest('.question-card').remove();
        });
    }
    
    function addShortAnswerQuestion() {
        const questionId = Date.now();
        const questionHtml = `
            <div class="question-card" data-id="${questionId}" data-type="short-answer">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-medium">Câu hỏi tự luận ngắn</h4>
                    <button class="delete-question text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Nội dung câu hỏi</label>
                    <textarea class="question-content w-full p-2 border rounded" placeholder="Nhập nội dung câu hỏi..."></textarea>
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Đáp án mẫu</label>
                    <textarea class="correct-answer w-full p-2 border rounded" placeholder="Nhập đáp án mẫu..."></textarea>
                </div>
            </div>
        `;
        
        document.getElementById('questions-container').insertAdjacentHTML('beforeend', questionHtml);
        
        // Thêm sự kiện cho nút xóa
        document.querySelector(`[data-id="${questionId}"] .delete-question`).addEventListener('click', function() {
            this.closest('.question-card').remove();
        });
    }
    
    function addEssayQuestion() {
        const questionId = Date.now();
        const questionHtml = `
            <div class="question-card" data-id="${questionId}" data-type="essay">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-medium">Câu hỏi tự luận dài</h4>
                    <button class="delete-question text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Nội dung câu hỏi</label>
                    <textarea class="question-content w-full p-2 border rounded" placeholder="Nhập nội dung câu hỏi..."></textarea>
                </div>
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Hướng dẫn chấm điểm</label>
                    <textarea class="grading-guide w-full p-2 border rounded" placeholder="Nhập hướng dẫn chấm điểm..."></textarea>
                </div>
            </div>
        `;
        
        document.getElementById('questions-container').insertAdjacentHTML('beforeend', questionHtml);
        
        // Thêm sự kiện cho nút xóa
        document.querySelector(`[data-id="${questionId}"] .delete-question`).addEventListener('click', function() {
            this.closest('.question-card').remove();
        });
    }
    
    function previewExam() {
        const previewContent = document.getElementById('preview-content');
        previewContent.innerHTML = '';
        
        // Thêm thông tin cơ bản
        const examInfoHtml = `
            <div class="mb-6">
                <h3 class="text-xl font-bold mb-2">${examData.name}</h3>
                <p class="text-gray-600 mb-2">Thời gian làm bài: ${examData.duration} phút</p>
                <p class="text-gray-600">${examData.description}</p>
            </div>
        `;
        previewContent.insertAdjacentHTML('beforeend', examInfoHtml);
        
        // Thêm câu hỏi
        if (examData.questions.length > 0) {
            const questionsHtml = examData.questions.map((question, index) => {
                let questionHtml = `
                    <div class="mb-6">
                        <h4 class="font-bold mb-2">Câu ${index + 1}: ${question.content}</h4>
                `;
                
                if (question.type === 'multiple-choice') {
                    questionHtml += `
                        <div class="space-y-2 ml-4">
                            ${question.options.map(option => `
                                <div class="flex items-center">
                                    <input type="radio" disabled class="mr-2">
                                    <span>${option.option}: ${option.text}</span>
                                    ${option.isCorrect ? '<span class="ml-2 text-green-600"><i class="fas fa-check"></i></span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else if (question.type === 'true-false') {
                    questionHtml += `
                        <div class="space-y-2 ml-4">
                            <div class="flex items-center">
                                <input type="radio" disabled ${question.correctAnswer === 'true' ? 'checked' : ''} class="mr-2">
                                <span>Đúng</span>
                            </div>
                            <div class="flex items-center">
                                <input type="radio" disabled ${question.correctAnswer === 'false' ? 'checked' : ''} class="mr-2">
                                <span>Sai</span>
                            </div>
                        </div>
                    `;
                } else if (question.type === 'short-answer') {
                    questionHtml += `
                        <div class="ml-4">
                            <p class="text-gray-600 mb-2">Đáp án mẫu:</p>
                            <p class="bg-gray-100 p-3 rounded">${question.correctAnswer}</p>
                        </div>
                    `;
                } else if (question.type === 'essay') {
                    questionHtml += `
                        <div class="ml-4">
                            <p class="text-gray-600 mb-2">Hướng dẫn chấm:</p>
                            <p class="bg-gray-100 p-3 rounded">${question.gradingGuide}</p>
                        </div>
                    `;
                }
                
                questionHtml += `</div>`;
                return questionHtml;
            }).join('');
            
            previewContent.insertAdjacentHTML('beforeend', questionsHtml);
        }
    }
    
    function saveExam() {
        // Thu thập dữ liệu câu hỏi
        if (examMethod === 'manual') {
            examData.questions = [];
            const questionCards = document.querySelectorAll('.question-card');
            
            questionCards.forEach(card => {
                const questionId = card.getAttribute('data-id');
                const questionType = card.getAttribute('data-type');
                const questionContent = card.querySelector('.question-content').value;
                
                if (!questionContent) return;
                
                let questionData = {
                    id: questionId,
                    type: questionType,
                    content: questionContent
                };
                
                if (questionType === 'multiple-choice') {
                    const options = [];
                    const optionInputs = card.querySelectorAll('.answer-option');
                    
                    optionInputs.forEach((input, index) => {
                        const optionText = input.value;
                        if (!optionText) return;
                        
                        const optionChar = String.fromCharCode(65 + index);
                        const isCorrect = card.querySelector(`input[name="correct-answer-${questionId}"][value="${optionChar}"]`).checked;
                        
                        options.push({
                            option: optionChar,
                            text: optionText,
                            isCorrect: isCorrect
                        });
                    });
                    
                    questionData.options = options;
                } else if (questionType === 'true-false') {
                    const correctAnswer = card.querySelector(`input[name="correct-answer-${questionId}"]:checked`)?.value;
                    questionData.correctAnswer = correctAnswer || 'true';
                } else if (questionType === 'short-answer') {
                    const correctAnswer = card.querySelector('.correct-answer').value;
                    questionData.correctAnswer = correctAnswer;
                } else if (questionType === 'essay') {
                    const gradingGuide = card.querySelector('.grading-guide').value;
                    questionData.gradingGuide = gradingGuide;
                }
                
                examData.questions.push(questionData);
            });
        }
        
        // Lưu vào Firestore
        const user = auth.currentUser;
        if (!user) {
            alert('Vui lòng đăng nhập để lưu đề thi');
            return;
        }
        
        examData.createdBy = user.uid;
        examData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        db.collection('exams').add(examData)
            .then(docRef => {
                console.log('Đề thi đã được lưu với ID:', docRef.id);
                showExamResult(docRef.id);
            })
            .catch(error => {
                console.error('Lỗi khi lưu đề thi:', error);
                alert('Có lỗi xảy ra khi lưu đề thi. Vui lòng thử lại.');
            });
    }
    
    function showExamResult(examId) {
        const examLink = `${window.location.origin}/take-exam.html?examId=${examId}`;
        document.getElementById('exam-link').value = examLink;
        
        // Tạo mã QR
        QRCode.toCanvas(document.getElementById('qr-code'), examLink, {
            width: 128,
            margin: 1
        }, function(error) {
            if (error) console.error('Lỗi khi tạo mã QR:', error);
        });
        
        examPreview.classList.add('hidden');
        examResult.classList.remove('hidden');
    }
    
    // Xử lý sao chép link
    document.getElementById('copy-link').addEventListener('click', function() {
        const examLink = document.getElementById('exam-link');
        examLink.select();
        document.execCommand('copy');
        
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> Đã sao chép';
        
        setTimeout(() => {
            this.innerHTML = originalText;
        }, 2000);
    });
    
    // Xử lý các nút trong màn hình kết quả
    document.getElementById('view-exam').addEventListener('click', function() {
        window.location.href = document.getElementById('exam-link').value;
    });
    
    document.getElementById('new-exam').addEventListener('click', function() {
        window.location.reload();
    });
    
    // Xử lý camera cho phương thức từ hình ảnh
    document.getElementById('open-camera').addEventListener('click', function() {
        const cameraView = document.getElementById('camera-view');
        const cameraPreview = document.getElementById('camera-preview');
        
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                cameraView.srcObject = stream;
                cameraPreview.classList.remove('hidden');
                this.style.display = 'none';
            })
            .catch(error => {
                console.error('Lỗi khi truy cập camera:', error);
                alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
            });
    });
    
    document.getElementById('capture-image').addEventListener('click', function() {
        const cameraView = document.getElementById('camera-view');
        const capturedImage = document.getElementById('captured-image');
        const canvas = document.createElement('canvas');
        canvas.width = cameraView.videoWidth;
        canvas.height = cameraView.videoHeight;
        canvas.getContext('2d').drawImage(cameraView, 0, 0);
        
        capturedImage.src = canvas.toDataURL('image/png');
        document.getElementById('camera-preview').classList.add('hidden');
        document.getElementById('captured-image-container').classList.remove('hidden');
        
        // Tắt camera
        cameraView.srcObject.getTracks().forEach(track => track.stop());
    });
    
    document.getElementById('retry-capture').addEventListener('click', function() {
        document.getElementById('captured-image-container').classList.add('hidden');
        document.getElementById('open-camera').style.display = 'block';
    });
    
    // Xử lý file Word
    document.getElementById('process-word-file').addEventListener('click', function() {
        const fileInput = document.getElementById('word-file');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Vui lòng chọn file Word');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(result => {
                    console.log('Nội dung file Word:', result.value);
                    // TODO: Xử lý nội dung file Word để tạo đề thi
                    alert('Đã đọc nội dung file Word. Chức năng xử lý tự động đang được phát triển.');
                })
                .catch(error => {
                    console.error('Lỗi khi đọc file Word:', error);
                    alert('Có lỗi xảy ra khi đọc file Word. Vui lòng thử lại.');
                });
        };
        reader.readAsArrayBuffer(file);
    });
    
    // Xử lý ảnh
    document.getElementById('process-image').addEventListener('click', function() {
        // TODO: Triển khai OCR để đọc nội dung ảnh
        alert('Chức năng đọc nội dung từ ảnh đang được phát triển.');
    });
    
    // Xử lý tạo đề với AI
    document.getElementById('generate-with-ai').addEventListener('click', function() {
        const prompt = document.getElementById('ai-prompt').value.trim();
        
        if (!prompt) {
            alert('Vui lòng nhập mô tả đề thi bạn muốn tạo');
            return;
        }
        
        // TODO: Gọi API AI để tạo đề thi
        alert('Chức năng tạo đề thi bằng AI đang được phát triển.');
    });
});