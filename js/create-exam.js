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

    // ================ BƯỚC 1: CÀI ĐẶT CƠ BẢN ================
    document.getElementById('next-to-step-2').addEventListener('click', function() {
        const examName = document.getElementById('exam-name').value.trim();
        const examDuration = parseInt(document.getElementById('exam-duration').value);
        const examDescription = document.getElementById('exam-description').value.trim();
        
        // Validate
        if (!examName) {
            alert('Vui lòng nhập tên đề thi');
            return;
        }
        
        if (isNaN(examDuration) || examDuration <= 0) {
            alert('Vui lòng nhập thời gian làm bài hợp lệ');
            return;
        }
        
        // Lưu dữ liệu
        examData.name = examName;
        examData.duration = examDuration;
        examData.description = examDescription;
        
        // Chuyển bước
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
        currentStep = 2;
    });

    // ================ BƯỚC 2: TẠO NỘI DUNG ĐỀ THI ================
    // Chọn phương thức tạo đề
    const methodButtons = ['manual', 'ai', 'word', 'image'];
    methodButtons.forEach(method => {
        document.getElementById(`${method}-method`).addEventListener('click', function() {
            // Reset các phương thức khác
            methodButtons.forEach(m => {
                document.getElementById(`${m}-method`).classList.remove('active');
                document.getElementById(`${m}-content`).classList.add('hidden');
            });
            
            // Kích hoạt phương thức được chọn
            this.classList.add('active');
            document.getElementById(`${method}-content`).classList.remove('hidden');
            examMethod = method;
        });
    });

    // ===== THÊM CÂU HỎI THỦ CÔNG =====
    document.getElementById('add-multiple-choice').addEventListener('click', addMultipleChoiceQuestion);
    document.getElementById('add-true-false').addEventListener('click', addTrueFalseQuestion);
    document.getElementById('add-short-answer').addEventListener('click', addShortAnswerQuestion);
    document.getElementById('add-essay').addEventListener('click', addEssayQuestion);

    // Chuyển sang bước 3
    document.getElementById('next-to-step-3').addEventListener('click', function() {
        // Thu thập câu hỏi nếu là phương thức thủ công
        if (examMethod === 'manual') {
            collectManualQuestions();
            if (examData.questions.length === 0) {
                alert('Vui lòng thêm ít nhất một câu hỏi');
                return;
            }
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

    // ================ BƯỚC 3: CÀI ĐẶT BỔ SUNG ================
    document.getElementById('create-exam').addEventListener('click', function() {
        // Lưu cài đặt chống gian lận
        examData.antiCheat = {
            preventCopy: document.getElementById('prevent-copy').checked,
            preventTabSwitch: document.getElementById('prevent-tab-switch').checked,
            notifyCheating: document.getElementById('notify-cheating').checked
        };

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

    // ================ LƯU ĐỀ THI ================
    document.getElementById('save-exam').addEventListener('click', async function() {
        try {
            // Validate dữ liệu
            if (!examData.name.trim()) {
                throw new Error('Vui lòng nhập tên đề thi');
            }
            
            if (examMethod === 'manual' && examData.questions.length === 0) {
                throw new Error('Vui lòng thêm ít nhất một câu hỏi');
            }

            // Kiểm tra đăng nhập
            const user = auth.currentUser;
            if (!user) {
                throw new Error('Vui lòng đăng nhập để lưu đề thi');
            }

            // Chuẩn bị dữ liệu lưu lên Firestore
            const examToSave = {
                name: examData.name,
                duration: examData.duration,
                description: examData.description,
                questions: examData.questions,
                antiCheat: examData.antiCheat,
                createdBy: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                questionCount: examData.questions.length,
                method: examMethod
            };

            console.log('Dữ liệu sẽ lưu:', examToSave);

            // Lưu vào Firestore
            const docRef = await db.collection('exams').add(examToSave);
            console.log('Đề thi đã lưu với ID:', docRef.id);
            
            // Hiển thị kết quả
            showExamResult(docRef.id);
            
        } catch (error) {
            console.error('Lỗi khi lưu đề thi:', error);
            alert(`Lỗi: ${error.message}`);
        }
    });

    // ================ CÁC HÀM HỖ TRỢ ================
    // 1. Thu thập câu hỏi thủ công
    function collectManualQuestions() {
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
            
            // Xử lý theo từng loại câu hỏi
            switch (questionType) {
                case 'multiple-choice':
                    const options = [];
                    const optionInputs = card.querySelectorAll('.answer-option');
                    const correctAnswer = card.querySelector(`input[name="correct-answer-${questionId}"]:checked`)?.value;
                    
                    optionInputs.forEach((input, index) => {
                        const optionText = input.value;
                        if (!optionText) return;
                        
                        const optionChar = String.fromCharCode(65 + index);
                        options.push({
                            option: optionChar,
                            text: optionText,
                            isCorrect: optionChar === correctAnswer
                        });
                    });
                    
                    questionData.options = options;
                    break;
                    
                case 'true-false':
                    questionData.correctAnswer = card.querySelector(`input[name="correct-answer-${questionId}"]:checked`)?.value || 'true';
                    break;
                    
                case 'short-answer':
                    questionData.correctAnswer = card.querySelector('.correct-answer').value || '';
                    break;
                    
                case 'essay':
                    questionData.gradingGuide = card.querySelector('.grading-guide').value || '';
                    break;
            }
            
            examData.questions.push(questionData);
        });
    }

    // 2. Thêm câu hỏi trắc nghiệm
    function addMultipleChoiceQuestion() {
        const questionId = Date.now();
        const questionHtml = `
            <div class="question-card p-4 mb-4 bg-white rounded-lg shadow" data-id="${questionId}" data-type="multiple-choice">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-medium text-gray-700">Câu hỏi trắc nghiệm</h4>
                    <button class="delete-question text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Nội dung câu hỏi</label>
                    <textarea class="question-content w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                              placeholder="Nhập nội dung câu hỏi..." required></textarea>
                </div>
                
                <div class="mb-3">
                    <label class="block text-gray-700 mb-2">Đáp án</label>
                    <div class="space-y-2">
                        <div class="flex items-center">
                            <input type="radio" name="correct-answer-${questionId}" value="A" class="mr-2">
                            <input type="text" class="answer-option w-full p-2 border rounded" placeholder="Đáp án A" required>
                        </div>
                        <div class="flex items-center">
                            <input type="radio" name="correct-answer-${questionId}" value="B" class="mr-2">
                            <input type="text" class="answer-option w-full p-2 border rounded" placeholder="Đáp án B" required>
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
        
        // Thêm sự kiện xóa câu hỏi
        const deleteBtn = document.querySelector(`[data-id="${questionId}"] .delete-question`);
        deleteBtn.addEventListener('click', function() {
            this.closest('.question-card').remove();
        });
        
        // Thêm sự kiện thêm lựa chọn
        const addOptionBtn = document.querySelector(`[data-id="${questionId}"] .add-option`);
        addOptionBtn.addEventListener('click', function() {
            const optionsContainer = this.previousElementSibling.querySelector('.space-y-2');
            const optionCount = optionsContainer.children.length;
            
            if (optionCount >= 8) {
                alert('Tối đa 8 lựa chọn');
                return;
            }
            
            const nextOption = String.fromCharCode(65 + optionCount);
            const optionHtml = `
                <div class="flex items-center">
                    <input type="radio" name="correct-answer-${questionId}" value="${nextOption}" class="mr-2">
                    <input type="text" class="answer-option w-full p-2 border rounded" placeholder="Đáp án ${nextOption}">
                </div>
            `;
            
            optionsContainer.insertAdjacentHTML('beforeend', optionHtml);
        });
    }

    // 3. Thêm câu hỏi Đúng/Sai
    function addTrueFalseQuestion() {
        const questionId = Date.now();
        const questionHtml = `
            <div class="question-card p-4 mb-4 bg-white rounded-lg shadow" data-id="${questionId}" data-type="true-false">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-medium text-gray-700">Câu hỏi Đúng/Sai</h4>
                    <button class="delete-question text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Nội dung câu hỏi</label>
                    <textarea class="question-content w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                              placeholder="Nhập nội dung câu hỏi..." required></textarea>
                </div>
                
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Đáp án đúng</label>
                    <div class="flex space-x-4">
                        <label class="flex items-center">
                            <input type="radio" name="correct-answer-${questionId}" value="true" class="mr-2" checked>
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
        
        // Thêm sự kiện xóa câu hỏi
        document.querySelector(`[data-id="${questionId}"] .delete-question`).addEventListener('click', function() {
            this.closest('.question-card').remove();
        });
    }

    // 4. Thêm câu hỏi tự luận ngắn
    function addShortAnswerQuestion() {
        const questionId = Date.now();
        const questionHtml = `
            <div class="question-card p-4 mb-4 bg-white rounded-lg shadow" data-id="${questionId}" data-type="short-answer">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-medium text-gray-700">Câu hỏi tự luận ngắn</h4>
                    <button class="delete-question text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Nội dung câu hỏi</label>
                    <textarea class="question-content w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                              placeholder="Nhập nội dung câu hỏi..." required></textarea>
                </div>
                
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Đáp án mẫu</label>
                    <textarea class="correct-answer w-full p-2 border rounded" 
                              placeholder="Nhập đáp án mẫu..."></textarea>
                </div>
            </div>
        `;
        
        document.getElementById('questions-container').insertAdjacentHTML('beforeend', questionHtml);
        
        // Thêm sự kiện xóa câu hỏi
        document.querySelector(`[data-id="${questionId}"] .delete-question`).addEventListener('click', function() {
            this.closest('.question-card').remove();
        });
    }

    // 5. Thêm câu hỏi tự luận dài
    function addEssayQuestion() {
        const questionId = Date.now();
        const questionHtml = `
            <div class="question-card p-4 mb-4 bg-white rounded-lg shadow" data-id="${questionId}" data-type="essay">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-medium text-gray-700">Câu hỏi tự luận dài</h4>
                    <button class="delete-question text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Nội dung câu hỏi</label>
                    <textarea class="question-content w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                              placeholder="Nhập nội dung câu hỏi..." required></textarea>
                </div>
                
                <div class="mb-3">
                    <label class="block text-gray-700 mb-1">Hướng dẫn chấm điểm</label>
                    <textarea class="grading-guide w-full p-2 border rounded" 
                              placeholder="Nhập hướng dẫn chấm điểm..."></textarea>
                </div>
            </div>
        `;
        
        document.getElementById('questions-container').insertAdjacentHTML('beforeend', questionHtml);
        
        // Thêm sự kiện xóa câu hỏi
        document.querySelector(`[data-id="${questionId}"] .delete-question`).addEventListener('click', function() {
            this.closest('.question-card').remove();
        });
    }

    // 6. Hiển thị preview đề thi
    function previewExam() {
        const previewContent = document.getElementById('preview-content');
        previewContent.innerHTML = '';
        
        // Thông tin đề thi
        previewContent.innerHTML = `
            <div class="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 class="text-xl font-bold text-blue-800 mb-2">${examData.name}</h3>
                <p class="text-gray-600 mb-1"><i class="fas fa-clock mr-2"></i> Thời gian: ${examData.duration} phút</p>
                <p class="text-gray-600"><i class="fas fa-info-circle mr-2"></i> ${examData.description || 'Không có mô tả'}</p>
            </div>
        `;
        
        // Danh sách câu hỏi
        if (examData.questions.length > 0) {
            const questionsHtml = examData.questions.map((question, index) => {
                let questionHtml = `
                    <div class="mb-6 p-4 bg-white rounded-lg shadow">
                        <h4 class="font-bold text-lg mb-3">Câu ${index + 1}: ${question.content}</h4>
                `;
                
                switch (question.type) {
                    case 'multiple-choice':
                        questionHtml += `<div class="ml-4 space-y-2">`;
                        question.options.forEach(option => {
                            questionHtml += `
                                <div class="flex items-center">
                                    <input type="radio" disabled ${option.isCorrect ? 'checked' : ''} class="mr-2">
                                    <span class="${option.isCorrect ? 'font-bold text-green-600' : ''}">
                                        ${option.option}. ${option.text}
                                        ${option.isCorrect ? ' (Đáp án đúng)' : ''}
                                    </span>
                                </div>
                            `;
                        });
                        questionHtml += `</div>`;
                        break;
                        
                    case 'true-false':
                        questionHtml += `
                            <div class="ml-4 space-y-2">
                                <div class="flex items-center">
                                    <input type="radio" disabled ${question.correctAnswer === 'true' ? 'checked' : ''} class="mr-2">
                                    <span>Đúng</span>
                                </div>
                                <div class="flex items-center">
                                    <input type="radio" disabled ${question.correctAnswer === 'false' ? 'checked' : ''} class="mr-2">
                                    <span>Sai</span>
                                </div>
                                <p class="mt-2 text-sm text-gray-600">Đáp án đúng: ${question.correctAnswer === 'true' ? 'Đúng' : 'Sai'}</p>
                            </div>
                        `;
                        break;
                        
                    case 'short-answer':
                        questionHtml += `
                            <div class="ml-4">
                                <p class="text-gray-700 mb-1">Đáp án mẫu:</p>
                                <p class="bg-gray-100 p-3 rounded whitespace-pre-line">${question.correctAnswer || 'Không có đáp án mẫu'}</p>
                            </div>
                        `;
                        break;
                        
                    case 'essay':
                        questionHtml += `
                            <div class="ml-4">
                                <p class="text-gray-700 mb-1">Hướng dẫn chấm:</p>
                                <p class="bg-gray-100 p-3 rounded whitespace-pre-line">${question.gradingGuide || 'Không có hướng dẫn chấm'}</p>
                            </div>
                        `;
                        break;
                }
                
                questionHtml += `</div>`;
                return questionHtml;
            }).join('');
            
            previewContent.insertAdjacentHTML('beforeend', questionsHtml);
        } else {
            previewContent.insertAdjacentHTML('beforeend', '<p class="text-gray-500 italic">Chưa có câu hỏi nào</p>');
        }
    }

    // 7. Hiển thị kết quả sau khi lưu
    function showExamResult(examId) {
        const examLink = `${window.location.origin}/take-exam.html?examId=${examId}`;
        document.getElementById('exam-link').value = examLink;
        
        // Tạo mã QR
        QRCode.toCanvas(document.getElementById('qr-code'), examLink, {
            width: 150,
            margin: 1,
            color: {
                dark: '#4f46e5', // Màu chính
                light: '#ffffff' // Màu nền
            }
        }, function(error) {
            if (error) console.error('Lỗi tạo QR code:', error);
        });
        
        examPreview.classList.add('hidden');
        examResult.classList.remove('hidden');
        
        // Sự kiện copy link
        document.getElementById('copy-link').addEventListener('click', function() {
            const linkInput = document.getElementById('exam-link');
            linkInput.select();
            document.execCommand('copy');
            
            // Hiệu ứng khi copy
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Đã sao chép';
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    }
});
