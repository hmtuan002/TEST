document.addEventListener('DOMContentLoaded', function() {
    // Biến toàn cục
    let examData = null;
    let timeLeft = 0;
    let timerInterval = null;
    let studentAnswers = {};
    let examId = null;
    
    // DOM Elements
    const joinScreen = document.querySelector('.bg-white.rounded-xl');
    const studentInfoScreen = document.getElementById('student-info');
    const examScreen = document.getElementById('exam-screen');
    const resultScreen = document.getElementById('result-screen');
    
    // Xử lý tham gia đề thi từ người khác
    document.getElementById('join-exam').addEventListener('click', function() {
        const examLink = document.getElementById('exam-link').value.trim();
        
        if (!examLink) {
            alert('Vui lòng nhập link đề thi');
            return;
        }
        
        // Trích xuất examId từ URL
        const url = new URL(examLink);
        examId = url.searchParams.get('examId');
        
        if (!examId) {
            alert('Link đề thi không hợp lệ');
            return;
        }
        
        loadExam(examId);
    });
    
    // Xử lý quét QR code
    document.getElementById('start-scan').addEventListener('click', function() {
        const qrScanner = document.getElementById('qr-scanner');
        const video = document.createElement('video');
        const canvasElement = document.createElement('canvas');
        const canvas = canvasElement.getContext('2d');
        
        qrScanner.innerHTML = '';
        qrScanner.appendChild(video);
        
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                video.srcObject = stream;
                video.setAttribute('playsinline', true);
                video.play();
                
                function tick() {
                    if (video.readyState === video.HAVE_ENOUGH_DATA) {
                        canvasElement.height = video.videoHeight;
                        canvasElement.width = video.videoWidth;
                        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                        
                        const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: 'dontInvert'
                        });
                        
                        if (code) {
                            const url = new URL(code.data);
                            examId = url.searchParams.get('examId');
                            
                            if (examId) {
                                // Dừng stream
                                video.srcObject.getTracks().forEach(track => track.stop());
                                loadExam(examId);
                            } else {
                                alert('Mã QR không chứa thông tin đề thi hợp lệ');
                            }
                        }
                    }
                    
                    requestAnimationFrame(tick);
                }
                
                tick();
            })
            .catch(error => {
                console.error('Lỗi khi truy cập camera:', error);
                alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
            });
    });
    
    // Xử lý tham gia đề thi AI
    document.getElementById('start-ai-exam').addEventListener('click', function() {
        const topic = document.getElementById('ai-topic').value;
        const duration = parseInt(document.getElementById('ai-duration').value);
        
        generateAiExam(topic, duration);
    });
    
    // Xử lý bắt đầu làm bài
    document.getElementById('start-exam').addEventListener('click', function() {
        const studentName = document.getElementById('student-name').value.trim();
        
        if (!studentName) {
            alert('Vui lòng nhập họ tên');
            return;
        }
        
        studentAnswers.studentInfo = {
            name: studentName,
            email: document.getElementById('student-email').value.trim(),
            phone: document.getElementById('student-phone').value.trim(),
            startedAt: new Date()
        };
        
        studentInfoScreen.classList.add('hidden');
        examScreen.classList.remove('hidden');
        startTimer();
    });
    
    // Xử lý nộp bài
    document.getElementById('submit-exam').addEventListener('click', function() {
        if (confirm('Bạn có chắc chắn muốn nộp bài?')) {
            submitExam();
        }
    });
    
    // Xử lý lưu bài làm tạm thời
    document.getElementById('save-exam').addEventListener('click', function() {
        saveTemporaryAnswers();
        alert('Bài làm của bạn đã được lưu tạm thời');
    });
    
    // Xử lý quay về trang chủ
    document.getElementById('back-to-home').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Các hàm hỗ trợ
    function loadExam(examId) {
        db.collection('exams').doc(examId).get()
            .then(doc => {
                if (!doc.exists) {
                    throw new Error('Đề thi không tồn tại');
                }
                
                examData = doc.data();
                examData.id = doc.id;
                
                // Hiển thị màn hình nhập thông tin thí sinh
                joinScreen.classList.add('hidden');
                studentInfoScreen.classList.remove('hidden');
                
                // Cập nhật thời gian làm bài
                timeLeft = examData.duration * 60;
            })
            .catch(error => {
                console.error('Lỗi khi tải đề thi:', error);
                alert('Không thể tải đề thi. Vui lòng kiểm tra lại link.');
            });
    }
    
    function generateAiExam(topic, duration) {
        // TODO: Gọi API AI để tạo đề thi ngẫu nhiên
        // Tạm thời tạo dữ liệu mẫu
        examData = {
            id: 'ai-exam-' + Date.now(),
            name: 'Đề thi Văn học AI - ' + getTopicName(topic),
            duration: duration,
            description: 'Đề thi được tạo tự động bởi AI dựa trên chủ đề ' + getTopicName(topic),
            questions: generateSampleQuestions(topic),
            isAiExam: true
        };
        
        timeLeft = duration * 60;
        
        // Hiển thị màn hình nhập thông tin thí sinh
        joinScreen.classList.add('hidden');
        studentInfoScreen.classList.remove('hidden');
    }
    
    function getTopicName(topic) {
        const topics = {
            'general': 'Tổng hợp',
            'reading': 'Đọc hiểu văn bản',
            'social': 'Nghị luận xã hội',
            'literature': 'Nghị luận văn học',
            'poem': 'Thơ ca',
            'prose': 'Văn xuôi'
        };
        
        return topics[topic] || 'Tổng hợp';
    }
    
    function generateSampleQuestions(topic) {
        // Tạo câu hỏi mẫu dựa trên chủ đề
        const questions = [];
        
        if (topic === 'general' || topic === 'reading') {
            questions.push({
                id: 'q1',
                type: 'reading',
                content: 'Đọc đoạn văn sau và trả lời câu hỏi:\n\n"Trong cuộc sống, có những lúc chúng ta phải đối mặt với nhiều khó khăn, thử thách. Nhưng chính những lúc đó mới là cơ hội để chúng ta thể hiện bản lĩnh và trưởng thành hơn."\n\nCâu hỏi: Nêu nội dung chính của đoạn văn trên?'
            });
        }
        
        if (topic === 'general' || topic === 'social') {
            questions.push({
                id: 'q2',
                type: 'essay',
                content: 'Viết một đoạn văn nghị luận (khoảng 200 chữ) trình bày suy nghĩ của em về ý nghĩa của việc vượt qua khó khăn trong cuộc sống.'
            });
        }
        
        if (topic === 'general' || topic === 'literature' || topic === 'poem') {
            questions.push({
                id: 'q3',
                type: 'essay',
                content: 'Phân tích đoạn thơ sau trong bài "Việt Bắc" của Tố Hữu:\n\n"Mình về mình có nhớ ta\nMười lăm năm ấy thiết tha mặn nồng\nMình về mình có nhớ không\nNhìn cây nhớ núi, nhìn sông nhớ nguồn"'
            });
        }
        
        if (topic === 'general' || topic === 'literature' || topic === 'prose') {
            questions.push({
                id: 'q4',
                type: 'essay',
                content: 'Phân tích nhân vật Chí Phèo trong tác phẩm cùng tên của Nam Cao để làm rõ quá trình tha hóa và thức tỉnh của nhân vật này.'
            });
        }
        
        return questions;
    }
    
    function startTimer() {
        updateTimerDisplay();
        
        document.getElementById('exam-title').textContent = examData.name;
        document.getElementById('exam-description').textContent = examData.description;
        
        // Hiển thị câu hỏi
        displayQuestions();
        
        // Bắt đầu đếm ngược
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                alert('Hết giờ làm bài! Hệ thống sẽ tự động nộp bài.');
                submitExam();
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('exam-timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Đổi màu khi thời gian sắp hết
        if (timeLeft <= 300) { // 5 phút
            document.getElementById('exam-timer').classList.add('text-red-600');
        }
    }
    
    function displayQuestions() {
        const examContent = document.getElementById('exam-content');
        examContent.innerHTML = '';
        
        examData.questions.forEach((question, index) => {
            const questionHtml = `
                <div class="question-card" data-question-id="${question.id}">
                    <h3 class="font-bold mb-4">Câu ${index + 1}: ${question.content}</h3>
                    ${getAnswerInput(question, index)}
                </div>
            `;
            
            examContent.insertAdjacentHTML('beforeend', questionHtml);
        });
    }
    
    function getAnswerInput(question, index) {
        if (question.type === 'reading' || question.type === 'essay') {
            return `
                <textarea class="w-full p-3 border rounded-lg answer-input" 
                          data-question-id="${question.id}"
                          placeholder="Nhập câu trả lời của bạn..." 
                          rows="${question.type === 'essay' ? 8 : 4}"></textarea>
            `;
        } else if (question.type === 'multiple-choice') {
            return `
                <div class="space-y-2 ml-4">
                    ${question.options.map(option => `
                        <label class="flex items-center">
                            <input type="radio" name="answer-${index}" 
                                   value="${option.option}" 
                                   data-question-id="${question.id}"
                                   class="mr-2">
                            <span>${option.option}. ${option.text}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        } else if (question.type === 'true-false') {
            return `
                <div class="space-y-2 ml-4">
                    <label class="flex items-center">
                        <input type="radio" name="answer-${index}" 
                               value="true" 
                               data-question-id="${question.id}"
                               class="mr-2">
                        <span>Đúng</span>
                    </label>
                    <label class="flex items-center">
                        <input type="radio" name="answer-${index}" 
                               value="false" 
                               data-question-id="${question.id}"
                               class="mr-2">
                        <span>Sai</span>
                    </label>
                </div>
            `;
        }
        
        return '<p>Loại câu hỏi không được hỗ trợ</p>';
    }
    
    function collectAnswers() {
        studentAnswers.answers = {};
        
        // Thu thập câu trả lời từ textarea
        document.querySelectorAll('.answer-input').forEach(input => {
            const questionId = input.getAttribute('data-question-id');
            studentAnswers.answers[questionId] = {
                type: 'text',
                answer: input.value
            };
        });
        
        // Thu thập câu trả lời từ radio button
        document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            const questionId = radio.getAttribute('data-question-id');
            studentAnswers.answers[questionId] = {
                type: 'choice',
                answer: radio.value
            };
        });
    }
    
    function saveTemporaryAnswers() {
        collectAnswers();
        
        // Lưu vào localStorage
        if (examData.id) {
            localStorage.setItem(`exam-${examData.id}`, JSON.stringify(studentAnswers));
        }
    }
    
    function submitExam() {
        clearInterval(timerInterval);
        collectAnswers();
        
        studentAnswers.submittedAt = new Date();
        studentAnswers.timeSpent = examData.duration * 60 - timeLeft;
        
        examScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        
        // Hiển thị kết quả
        if (examData.isAiExam) {
            evaluateWithAI();
        } else {
            document.getElementById('ai-result').classList.add('hidden');
            document.getElementById('waiting-result').classList.remove('hidden');
            document.getElementById('result-message').textContent = 'Bài thi của bạn đã được nộp thành công!';
            
            // Lưu kết quả lên Firestore
            saveExamResult();
        }
    }
    
    function evaluateWithAI() {
        // TODO: Gọi API AI để chấm điểm
        // Tạm thời hiển thị kết quả mẫu
        document.getElementById('waiting-result').classList.add('hidden');
        document.getElementById('ai-result').classList.remove('hidden');
        document.getElementById('result-message').textContent = 'Kết quả bài thi của bạn:';
        
        const aiResult = document.getElementById('ai-result');
        aiResult.innerHTML = '';
        
        // Thêm đánh giá tổng quan
        const overallHtml = `
            <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-bold mb-2">Đánh giá tổng quan</h3>
                <p>Bài làm của bạn đạt mức độ khá tốt. Nội dung các câu trả lời thể hiện sự hiểu biết về vấn đề, tuy nhiên cần chú ý hơn đến cách diễn đạt và bố cục bài viết.</p>
                <div class="mt-4 font-bold">Điểm số ước tính: 7.5/10</div>
            </div>
        `;
        aiResult.insertAdjacentHTML('beforeend', overallHtml);
        
        // Thêm đánh giá từng câu
        examData.questions.forEach((question, index) => {
            const questionHtml = `
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h4 class="font-bold mb-2">Câu ${index + 1}</h4>
                    <p class="text-gray-600 mb-2">${getAiFeedback(question)}</p>
                    <div class="text-sm text-gray-500">Gợi ý cải thiện: ${getAiImprovement(question)}</div>
                </div>
            `;
            
            aiResult.insertAdjacentHTML('beforeend', questionHtml);
        });
    }
    
    function getAiFeedback(question) {
        const feedbacks = {
            'reading': 'Câu trả lời của bạn thể hiện sự hiểu biết về nội dung đoạn văn, nhưng có thể trình bày rõ ràng và mạch lạc hơn.',
            'essay': 'Bài viết có bố cục tương đối rõ ràng, nội dung phong phú. Tuy nhiên cần chú ý đến cách liên kết giữa các ý và sử dụng dẫn chứng cụ thể hơn.',
            'multiple-choice': 'Bạn đã chọn đáp án chính xác.',
            'true-false': 'Bạn đã xác định đúng/sai chính xác.'
        };
        
        return feedbacks[question.type] || 'Câu hỏi này đã được trả lời.';
    }
    
    function getAiImprovement(question) {
        const improvements = {
            'reading': 'Nên đọc kỹ đề bài và gạch chân các từ khóa quan trọng trước khi trả lời.',
            'essay': 'Nên lập dàn ý trước khi viết để đảm bảo bài viết có bố cục chặt chẽ và đầy đủ ý.',
            'multiple-choice': 'Đọc kỹ tất cả các lựa chọn trước khi quyết định đáp án cuối cùng.',
            'true-false': 'Phân tích kỹ nội dung câu hỏi để xác định tính đúng sai chính xác.'
        };
        
        return improvements[question.type] || 'Tiếp tục luyện tập để cải thiện kết quả.';
    }
    
    function saveExamResult() {
        if (!examData.id || examData.isAiExam) return;
        
        const user = auth.currentUser;
        const resultData = {
            examId: examData.id,
            examName: examData.name,
            studentInfo: studentAnswers.studentInfo,
            answers: studentAnswers.answers,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            timeSpent: studentAnswers.timeSpent,
            status: 'submitted'
        };
        
        if (user) {
            resultData.userId = user.uid;
        }
        
        db.collection('exam_results').add(resultData)
            .then(() => {
                console.log('Kết quả bài thi đã được lưu');
            })
            .catch(error => {
                console.error('Lỗi khi lưu kết quả:', error);
            });
    }
    
    // Kiểm tra bài làm đã lưu tạm
    function checkTemporaryAnswers() {
        if (examData && examData.id) {
            const savedAnswers = localStorage.getItem(`exam-${examData.id}`);
            if (savedAnswers) {
                if (confirm('Bạn có bài làm chưa hoàn thành. Tiếp tục bài làm này?')) {
                    studentAnswers = JSON.parse(savedAnswers);
                    
                    // Điền lại câu trả lời
                    for (const questionId in studentAnswers.answers) {
                        const answer = studentAnswers.answers[questionId];
                        
                        if (answer.type === 'text') {
                            const textarea = document.querySelector(`.answer-input[data-question-id="${questionId}"]`);
                            if (textarea) textarea.value = answer.answer;
                        } else if (answer.type === 'choice') {
                            const radio = document.querySelector(`input[type="radio"][data-question-id="${questionId}"][value="${answer.answer}"]`);
                            if (radio) radio.checked = true;
                        }
                    }
                } else {
                    localStorage.removeItem(`exam-${examData.id}`);
                }
            }
        }
    }
    
    // Kiểm tra examId từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlExamId = urlParams.get('examId');
    
    if (urlExamId) {
        loadExam(urlExamId);
    }
});