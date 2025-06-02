document.addEventListener('DOMContentLoaded', function() {
    // Biến toàn cục
    let currentExam = {
        title: '',
        description: '',
        duration: 60,
        questions: [],
        settings: {
            antiCopy: true,
            antiTab: true,
            requireLogin: false,
            showTimer: true,
            randomOrder: false
        },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: auth.currentUser ? auth.currentUser.uid : null
    };
    
    let capturedImages = [];
    let currentStream = null;
    
    // Các hàm xử lý sự kiện
    document.getElementById('start-manual-btn').addEventListener('click', startManualCreation);
    document.getElementById('start-ai-btn').addEventListener('click', startAICreation);
    document.getElementById('start-word-btn').addEventListener('click', () => document.getElementById('word-file').click());
    document.getElementById('start-image-btn').addEventListener('click', () => document.getElementById('image-file').click());
    document.getElementById('start-camera-btn').addEventListener('click', startCamera);
    document.getElementById('add-question-btn').addEventListener('click', showQuestionModal);
    document.getElementById('generate-ai-btn').addEventListener('click', generateAIExam);
    document.getElementById('publish-exam-btn').addEventListener('click', publishExam);
    document.getElementById('create-new-btn').addEventListener('click', resetExam);
    
    // Xử lý file Word
    document.getElementById('word-file').addEventListener('change', handleWordFile);
    
    // Xử lý file ảnh
    document.getElementById('image-file').addEventListener('change', handleImageFile);
    
    // Modal câu hỏi
    document.getElementById('question-type').addEventListener('change', updateQuestionForm);
    document.getElementById('save-question-btn').addEventListener('click', saveQuestion);
    document.getElementById('cancel-question-btn').addEventListener('click', closeQuestionModal);
    document.getElementById('close-modal-btn').addEventListener('click', closeQuestionModal);
    document.getElementById('add-option-btn').addEventListener('click', addOption);
    
    // Modal camera
    document.getElementById('capture-btn').addEventListener('click', captureImage);
    document.getElementById('switch-camera-btn').addEventListener('click', switchCamera);
    document.getElementById('process-images-btn').addEventListener('click', processImages);
    document.getElementById('cancel-capture-btn').addEventListener('click', cancelCapture);
    document.getElementById('close-camera-btn').addEventListener('click', cancelCapture);
    
    // Cài đặt đề thi
    document.getElementById('anti-copy').addEventListener('change', updateSettings);
    document.getElementById('anti-tab').addEventListener('change', updateSettings);
    document.getElementById('require-login').addEventListener('change', updateSettings);
    document.getElementById('show-timer').addEventListener('change', updateSettings);
    document.getElementById('random-order').addEventListener('change', updateSettings);
    
    // Chia sẻ
    document.getElementById('copy-link-btn').addEventListener('click', copyExamLink);
    document.getElementById('download-qr-btn').addEventListener('click', downloadQRCode);
    
    // Hàm bắt đầu tạo thủ công
    function startManualCreation() {
        document.getElementById('manual-option').classList.add('hidden');
        document.getElementById('ai-option').classList.add('hidden');
        document.getElementById('word-option').classList.add('hidden');
        document.getElementById('image-option').classList.add('hidden');
        
        // Lấy thông tin cơ bản
        currentExam.title = document.getElementById('exam-title').value || 'Đề thi Ngữ Văn';
        currentExam.description = document.getElementById('exam-description').value || '';
        currentExam.duration = parseInt(document.getElementById('exam-duration').value) || 60;
        
        document.getElementById('manual-creation').classList.remove('hidden');
    }
    
    // Hàm bắt đầu tạo bằng AI
    function startAICreation() {
        document.getElementById('manual-option').classList.add('hidden');
        document.getElementById('ai-option').classList.add('hidden');
        document.getElementById('word-option').classList.add('hidden');
        document.getElementById('image-option').classList.add('hidden');
        
        // Lấy thông tin cơ bản
        currentExam.title = document.getElementById('exam-title').value || 'Đề thi Ngữ Văn';
        currentExam.description = document.getElementById('exam-description').value || '';
        currentExam.duration = parseInt(document.getElementById('exam-duration').value) || 60;
        
        document.getElementById('ai-creation').classList.remove('hidden');
    }
    
    // Hàm hiển thị modal thêm câu hỏi
    function showQuestionModal() {
        document.getElementById('question-modal').classList.remove('hidden');
        updateQuestionForm();
    }
    
    // Hàm cập nhật form câu hỏi dựa trên loại
    function updateQuestionForm() {
        const type = document.getElementById('question-type').value;
        
        document.getElementById('mc-options').classList.add('hidden');
        document.getElementById('tf-options').classList.add('hidden');
        document.getElementById('sa-options').classList.add('hidden');
        
        if (type === 'multiple-choice') {
            document.getElementById('mc-options').classList.remove('hidden');
        } else if (type === 'true-false') {
            document.getElementById('tf-options').classList.remove('hidden');
        } else {
            document.getElementById('sa-options').classList.remove('hidden');
        }
    }
    
    // Hàm thêm lựa chọn cho câu hỏi trắc nghiệm
    function addOption() {
        const optionsContainer = document.getElementById('mc-options');
        const optionCount = optionsContainer.querySelectorAll('div.flex').length;
        const optionLetter = String.fromCharCode(65 + optionCount);
        
        const optionDiv = document.createElement('div');
        optionDiv.className = 'flex items-center space-x-2';
        optionDiv.innerHTML = `
            <input type="text" class="flex-1 px-3 py-1 border rounded" placeholder="Lựa chọn ${optionLetter}">
            <input type="radio" name="correct-option" value="${optionCount}">
        `;
        
        optionsContainer.insertBefore(optionDiv, document.getElementById('add-option-btn').parentNode);
    }
    
    // Hàm lưu câu hỏi
    function saveQuestion() {
        const type = document.getElementById('question-type').value;
        const content = document.getElementById('question-content').value;
        const points = parseFloat(document.getElementById('question-points').value) || 1;
        
        if (!content) {
            alert('Vui lòng nhập nội dung câu hỏi');
            return;
        }
        
        const question = {
            type: type,
            content: content,
            points: points,
            number: currentExam.questions.length + 1
        };
        
        if (type === 'multiple-choice') {
            const options = [];
            const optionInputs = document.querySelectorAll('#mc-options input[type="text"]');
            const correctOption = document.querySelector('input[name="correct-option"]:checked').value;
            
            optionInputs.forEach((input, index) => {
                if (input.value) {
                    options.push({
                        text: input.value,
                        correct: index === parseInt(correctOption)
                    });
                }
            });
            
            if (options.length < 2) {
                alert('Vui lòng nhập ít nhất 2 lựa chọn');
                return;
            }
            
            question.options = options;
        } else if (type === 'true-false') {
            const correct = document.querySelector('input[name="correct-tf"]:checked').value === 'true';
            question.correctAnswer = correct;
        } else {
            const sampleAnswer = document.getElementById('sample-answer').value;
            if (sampleAnswer) {
                question.sampleAnswer = sampleAnswer;
            }
        }
        
        currentExam.questions.push(question);
        renderQuestions();
        closeQuestionModal();
    }
    
    // Hàm hiển thị danh sách câu hỏi
    function renderQuestions() {
        const container = document.getElementById('questions-container');
        container.innerHTML = '';
        
        currentExam.questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-card p-5';
            
            let optionsHtml = '';
            if (question.type === 'multiple-choice') {
                optionsHtml = '<div class="mt-3 space-y-2">';
                question.options.forEach((option, i) => {
                    optionsHtml += `
                        <div class="flex items-center">
                            <span class="font-medium mr-2">${String.fromCharCode(65 + i)}.</span>
                            <span>${option.text}</span>
                            ${option.correct ? '<span class="ml-2 text-green-500"><i class="fas fa-check"></i></span>' : ''}
                        </div>
                    `;
                });
                optionsHtml += '</div>';
            } else if (question.type === 'true-false') {
                optionsHtml = `
                    <div class="mt-2">
                        <span class="font-medium">Đáp án:</span> 
                        <span class="${question.correctAnswer ? 'text-green-500' : 'text-red-500'}">
                            ${question.correctAnswer ? 'Đúng' : 'Sai'}
                        </span>
                    </div>
                `;
            }
            
            questionDiv.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-gray-700"><span class="text-blue-600">Câu ${index + 1}:</span> ${question.content}</p>
                        <p class="text-sm text-gray-500 mt-1">Dạng câu hỏi: ${getQuestionTypeName(question.type)} • Điểm: ${question.points}</p>
                        ${optionsHtml}
                    </div>
                    <div class="flex space-x-2">
                        <button class="edit-question-btn text-blue-600 hover:text-blue-800" data-index="${index}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-question-btn text-red-600 hover:text-red-800" data-index="${index}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(questionDiv);
        });
        
        // Thêm sự kiện cho nút chỉnh sửa/xóa
        document.querySelectorAll('.edit-question-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                editQuestion(parseInt(this.dataset.index));
            });
        });
        
        document.querySelectorAll('.delete-question-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteQuestion(parseInt(this.dataset.index));
            });
        });
    }
    
    // Hàm lấy tên loại câu hỏi
    function getQuestionTypeName(type) {
        const types = {
            'multiple-choice': 'Trắc nghiệm',
            'true-false': 'Đúng/Sai',
            'short-answer': 'Trả lời ngắn',
            'essay': 'Tự luận'
        };
        return types[type] || type;
    }
    
    // Hàm chỉnh sửa câu hỏi
    function editQuestion(index) {
        const question = currentExam.questions[index];
        document.getElementById('question-type').value = question.type;
        document.getElementById('question-content').value = question.content;
        document.getElementById('question-points').value = question.points;
        
        if (question.type === 'multiple-choice') {
            // Xóa các lựa chọn hiện tại
            const optionsContainer = document.getElementById('mc-options');
            const optionDivs = optionsContainer.querySelectorAll('div.flex');
            optionDivs.forEach(div => {
                if (!div.contains(document.getElementById('add-option-btn'))) {
                    div.remove();
                }
            });
            
            // Thêm lại các lựa chọn
            question.options.forEach((option, i) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'flex items-center space-x-2';
                optionDiv.innerHTML = `
                    <input type="text" class="flex-1 px-3 py-1 border rounded" placeholder="Lựa chọn ${String.fromCharCode(65 + i)}" value="${option.text}">
                    <input type="radio" name="correct-option" value="${i}" ${option.correct ? 'checked' : ''}>
                `;
                optionsContainer.insertBefore(optionDiv, document.getElementById('add-option-btn').parentNode);
            });
        } else if (question.type === 'true-false') {
            document.querySelector(`input[name="correct-tf"][value="${question.correctAnswer}"]`).checked = true;
        } else if (question.sampleAnswer) {
            document.getElementById('sample-answer').value = question.sampleAnswer;
        }
        
        // Xóa câu hỏi cũ
        currentExam.questions.splice(index, 1);
        
        showQuestionModal();
    }
    
    // Hàm xóa câu hỏi
    function deleteQuestion(index) {
        if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
            currentExam.questions.splice(index, 1);
            
            // Cập nhật số thứ tự
            currentExam.questions.forEach((q, i) => {
                q.number = i + 1;
            });
            
            renderQuestions();
        }
    }
    
    // Hàm đóng modal câu hỏi
    function closeQuestionModal() {
        document.getElementById('question-modal').classList.add('hidden');
        document.getElementById('question-content').value = '';
        document.getElementById('sample-answer').value = '';
    }
    
    // Hàm tạo đề thi bằng AI
    async function generateAIExam() {
        const prompt = document.getElementById('ai-prompt').value;
        
        if (!prompt) {
            alert('Vui lòng nhập mô tả đề thi');
            return;
        }
        
        document.getElementById('generate-ai-btn').disabled = true;
        document.getElementById('generate-ai-btn').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang tạo...';
        
        try {
            // Gọi API AI để tạo đề thi
            const response = await fetchAIExam(prompt);
            
            currentExam.questions = response.questions;
            previewExam();
        } catch (error) {
            console.error('Lỗi khi tạo đề thi bằng AI:', error);
            alert('Có lỗi xảy ra khi tạo đề thi. Vui lòng thử lại.');
        } finally {
            document.getElementById('generate-ai-btn').disabled = false;
            document.getElementById('generate-ai-btn').innerHTML = '<i class="fas fa-magic mr-1"></i> Tạo đề thi';
        }
    }
    
    // Hàm giả lập gọi API AI
    async function fetchAIExam(prompt) {
        // Trong thực tế, bạn sẽ gọi API thực sự ở đây
        console.log('Gọi API AI với prompt:', prompt);
        
        // Giả lập response sau 2 giây
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Trả về dữ liệu mẫu
        return {
            questions: [
                {
                    type: 'multiple-choice',
                    content: 'Phương thức biểu đạt chính của đoạn văn trên là gì?',
                    points: 1,
                    options: [
                        { text: 'Tự sự', correct: false },
                        { text: 'Miêu tả', correct: false },
                        { text: 'Biểu cảm', correct: true },
                        { text: 'Nghị luận', correct: false }
                    ]
                },
                {
                    type: 'essay',
                    content: 'Phân tích nhân vật Mị trong tác phẩm "Vợ chồng A Phủ" của Tô Hoài.',
                    points: 4,
                    sampleAnswer: 'Bài làm cần phân tích được các đặc điểm tính cách, hoàn cảnh sống và diễn biến tâm lý của nhân vật Mị...'
                }
            ]
        };
    }
    
    // Hàm xử lý file Word
    async function handleWordFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Hiển thị loading
        document.getElementById('start-word-btn').disabled = true;
        document.getElementById('start-word-btn').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang xử lý...';
        
        try {
            // Trong thực tế, bạn sẽ upload file lên server để xử lý
            console.log('Upload file Word:', file.name);
            
            // Giả lập xử lý sau 3 giây
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Giả lập kết quả
            currentExam.title = file.name.replace('.docx', '');
            currentExam.questions = [
                {
                    type: 'short-answer',
                    content: 'Nêu ý nghĩa nhan đề tác phẩm "Chiếc thuyền ngoài xa" của Nguyễn Minh Châu.',
                    points: 2,
                    sampleAnswer: 'Nhan đề thể hiện sự đối lập giữa vẻ đẹp nghệ thuật và hiện thực cuộc sống...'
                },
                {
                    type: 'essay',
                    content: 'Phân tích hình tượng sông Đà trong tác phẩm "Người lái đò sông Đà" của Nguyễn Tuân.',
                    points: 4,
                    sampleAnswer: 'Bài làm cần phân tích được vẻ đẹp hung bạo và trữ tình của sông Đà...'
                }
            ];
            
            previewExam();
        } catch (error) {
            console.error('Lỗi khi xử lý file Word:', error);
            alert('Có lỗi xảy ra khi xử lý file Word. Vui lòng thử lại.');
        } finally {
            document.getElementById('start-word-btn').disabled = false;
            document.getElementById('start-word-btn').innerHTML = 'Chọn file';
        }
    }
    
    // Hàm xử lý file ảnh
    async function handleImageFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Hiển thị loading
        document.getElementById('start-image-btn').disabled = true;
        document.getElementById('start-image-btn').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang xử lý...';
        
        try {
            // Đọc file ảnh
            const reader = new FileReader();
            reader.onload = async function(e) {
                capturedImages = [{
                    src: e.target.result,
                    file: file
                }];
                
                // Xử lý ảnh
                await processImages();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Lỗi khi xử lý file ảnh:', error);
            alert('Có lỗi xảy ra khi xử lý file ảnh. Vui lòng thử lại.');
        } finally {
            document.getElementById('start-image-btn').disabled = false;
            document.getElementById('start-image-btn').innerHTML = 'Chọn ảnh';
        }
    }
    
    // Hàm bật camera
    async function startCamera() {
        try {
            document.getElementById('camera-modal').classList.remove('hidden');
            capturedImages = [];
            
            const constraints = {
                video: {
                    facingMode: 'environment' // Ưu tiên camera sau
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            currentStream = stream;
            document.getElementById('camera-preview').srcObject = stream;
        } catch (error) {
            console.error('Lỗi khi truy cập camera:', error);
            alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
        }
    }
    
    // Hàm chụp ảnh từ camera
    function captureImage() {
        const video = document.getElementById('camera-preview');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg');
        capturedImages.push({
            src: imageData
        });
        
        updateCapturedImages();
    }
    
    // Hàm cập nhật danh sách ảnh đã chụp
    function updateCapturedImages() {
        const container = document.getElementById('captured-container');
        const imagesContainer = container.querySelector('div');
        
        if (capturedImages.length > 0) {
            container.classList.remove('hidden');
            imagesContainer.innerHTML = '';
            
            capturedImages.forEach((image, index) => {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'flex-shrink-0';
                imgDiv.innerHTML = `
                    <div class="relative">
                        <img src="${image.src}" class="w-32 h-24 object-cover rounded border">
                        <button class="delete-image-btn absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center" data-index="${index}">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                `;
                imagesContainer.appendChild(imgDiv);
            });
            
            // Thêm sự kiện xóa ảnh
            document.querySelectorAll('.delete-image-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    capturedImages.splice(parseInt(this.dataset.index), 1);
                    updateCapturedImages();
                });
            });
        } else {
            container.classList.add('hidden');
        }
    }
    
    // Hàm đổi camera
    async function switchCamera() {
        if (!currentStream) return;
        
        try {
            // Dừng stream hiện tại
            currentStream.getTracks().forEach(track => track.stop());
            
            // Lấy danh sách thiết bị
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (videoDevices.length < 2) {
                alert('Không tìm thấy camera khác');
                return;
            }
            
            // Tìm camera khác
            const currentDeviceId = currentStream.getVideoTracks()[0].getSettings().deviceId;
            const otherDevice = videoDevices.find(device => device.deviceId !== currentDeviceId);
            
            if (!otherDevice) {
                alert('Không tìm thấy camera khác');
                return;
            }
            
            // Bật camera mới
            const constraints = {
                video: {
                    deviceId: { exact: otherDevice.deviceId }
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            currentStream = stream;
            document.getElementById('camera-preview').srcObject = stream;
        } catch (error) {
            console.error('Lỗi khi đổi camera:', error);
            alert('Có lỗi xảy ra khi đổi camera. Vui lòng thử lại.');
        }
    }
    
    // Hàm xử lý ảnh đã chụp
    async function processImages() {
        if (capturedImages.length === 0) {
            alert('Vui lòng chụp ít nhất một ảnh');
            return;
        }
        
        document.getElementById('process-images-btn').disabled = true;
        document.getElementById('process-images-btn').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang xử lý...';
        
        try {
            // Trong thực tế, bạn sẽ upload ảnh lên server để xử lý OCR
            console.log('Xử lý ảnh:', capturedImages.length);
            
            // Giả lập xử lý sau 3 giây
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Giả lập kết quả
            currentExam.title = 'Đề thi từ ảnh';
            currentExam.questions = [
                {
                    type: 'multiple-choice',
                    content: 'Tác giả của bài thơ "Sóng" là ai?',
                    points: 1,
                    options: [
                        { text: 'Xuân Quỳnh', correct: true },
                        { text: 'Huy Cận', correct: false },
                        { text: 'Tố Hữu', correct: false },
                        { text: 'Nguyễn Khoa Điềm', correct: false }
                    ]
                },
                {
                    type: 'essay',
                    content: 'Phân tích hình tượng sóng trong bài thơ "Sóng" của Xuân Quỳnh.',
                    points: 4,
                    sampleAnswer: 'Bài làm cần phân tích được hình tượng sóng như biểu tượng của tình yêu...'
                }
            ];
            
            cancelCapture();
            previewExam();
        } catch (error) {
            console.error('Lỗi khi xử lý ảnh:', error);
            alert('Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.');
        } finally {
            document.getElementById('process-images-btn').disabled = false;
            document.getElementById('process-images-btn').innerHTML = '<i class="fas fa-magic mr-1"></i> Xử lý ảnh';
        }
    }
    
    // Hàm hủy chụp ảnh
    function cancelCapture() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
        
        document.getElementById('camera-modal').classList.add('hidden');
        document.getElementById('camera-preview').srcObject = null;
        capturedImages = [];
    }
    
    // Hàm xem trước đề thi
    function previewExam() {
        document.getElementById('manual-creation').classList.add('hidden');
        document.getElementById('ai-creation').classList.add('hidden');
        
        // Cập nhật thông tin đề thi
        document.getElementById('preview-title').textContent = currentExam.title;
        document.getElementById('preview-duration').textContent = `${currentExam.duration} phút`;
        document.getElementById('preview-description').textContent = currentExam.description || 'Không có mô tả';
        
        // Hiển thị câu hỏi
        const container = document.getElementById('preview-questions');
        container.innerHTML = '';
        
        currentExam.questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-card p-5';
            
            let optionsHtml = '';
            if (question.type === 'multiple-choice') {
                optionsHtml = '<div class="mt-3 space-y-2">';
                question.options.forEach((option, i) => {
                    optionsHtml += `
                        <div class="flex items-center">
                            <span class="font-medium mr-2">${String.fromCharCode(65 + i)}.</span>
                            <span>${option.text}</span>
                        </div>
                    `;
                });
                optionsHtml += '</div>';
            }
            
            questionDiv.innerHTML = `
                <div>
                    <p class="font-bold text-gray-700"><span class="text-blue-600">Câu ${index + 1}:</span> ${question.content}</p>
                    <p class="text-sm text-gray-500 mt-1">Dạng câu hỏi: ${getQuestionTypeName(question.type)} • Điểm: ${question.points}</p>
                    ${optionsHtml}
                </div>
            `;
            
            container.appendChild(questionDiv);
        });
        
        // Cập nhật cài đặt
        updateSettings();
        
        document.getElementById('exam-preview').classList.remove('hidden');
    }
    
    // Hàm cập nhật cài đặt đề thi
    function updateSettings() {
        currentExam.settings = {
            antiCopy: document.getElementById('anti-copy').checked,
            antiTab: document.getElementById('anti-tab').checked,
            requireLogin: document.getElementById('require-login').checked,
            showTimer: document.getElementById('show-timer').checked,
            randomOrder: document.getElementById('random-order').checked
        };
    }
    
    // Hàm xuất bản đề thi
    async function publishExam() {
        if (currentExam.questions.length === 0) {
            alert('Vui lòng thêm ít nhất một câu hỏi');
            return;
        }
        
        document.getElementById('publish-exam-btn').disabled = true;
        document.getElementById('publish-exam-btn').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang lưu...';
        
        try {
            // Lưu đề thi lên Firestore
            const examRef = await db.collection('exams').add(currentExam);
            
            // Tạo link tham gia
            const examId = examRef.id;
            const examLink = `${window.location.origin}/take-exam.html?examId=${examId}`;
            
            // Hiển thị phần chia sẻ
            document.getElementById('exam-preview').classList.add('hidden');
            
            document.getElementById('exam-link').value = examLink;
            
            // Tạo QR code
            const qrCodeDiv = document.getElementById('qr-code');
            qrCodeDiv.innerHTML = '';
            new QRCode(qrCodeDiv, {
                text: examLink,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            document.getElementById('share-exam').classList.remove('hidden');
            
            // Cập nhật link chia sẻ
            document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(examLink)}`;
            document.getElementById('share-zalo').href = `https://zalo.me/share?text=${encodeURIComponent('Tham gia đề thi: ' + currentExam.title)}&url=${encodeURIComponent(examLink)}`;
        } catch (error) {
            console.error('Lỗi khi lưu đề thi:', error);
            alert('Có lỗi xảy ra khi lưu đề thi. Vui lòng thử lại.');
        } finally {
            document.getElementById('publish-exam-btn').disabled = false;
            document.getElementById('publish-exam-btn').innerHTML = '<i class="fas fa-share-square mr-1"></i> Xuất bản đề thi';
        }
    }
    
    // Hàm sao chép link đề thi
    function copyExamLink() {
        const linkInput = document.getElementById('exam-link');
        linkInput.select();
        document.execCommand('copy');
        
        alert('Đã sao chép link vào clipboard!');
    }
    
    // Hàm tải QR code
    function downloadQRCode() {
        const qrCodeDiv = document.getElementById('qr-code');
        const canvas = qrCodeDiv.querySelector('canvas');
        
        const link = document.createElement('a');
        link.download = `qr-code-${currentExam.title}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    // Hàm reset đề thi
    function resetExam() {
        currentExam = {
            title: '',
            description: '',
            duration: 60,
            questions: [],
            settings: {
                antiCopy: true,
                antiTab: true,
                requireLogin: false,
                showTimer: true,
                randomOrder: false
            },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: auth.currentUser ? auth.currentUser.uid : null
        };
        
        document.getElementById('exam-title').value = '';
        document.getElementById('exam-description').value = '';
        document.getElementById('exam-duration').value = '60';
        
        document.getElementById('manual-creation').classList.add('hidden');
        document.getElementById('ai-creation').classList.add('hidden');
        document.getElementById('exam-preview').classList.add('hidden');
        document.getElementById('share-exam').classList.add('hidden');
        
        document.getElementById('manual-option').classList.remove('hidden');
        document.getElementById('ai-option').classList.remove('hidden');
        document.getElementById('word-option').classList.remove('hidden');
        document.getElementById('image-option').classList.remove('hidden');
    }
});