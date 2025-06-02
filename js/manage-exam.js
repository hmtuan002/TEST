document.addEventListener('DOMContentLoaded', function() {
    // Biến toàn cục
    let currentUser = null;
    let exams = [];
    let results = [];
    let currentExam = null;
    let currentResult = null;
    
    // Các hàm xử lý sự kiện
    document.getElementById('tab-my-exams').addEventListener('click', () => switchTab('my-exams'));
    document.getElementById('tab-my-results').addEventListener('click', () => switchTab('my-results'));
    document.getElementById('refresh-exams-btn').addEventListener('click', loadExams);
    document.getElementById('refresh-results-btn').addEventListener('click', loadResults);
    document.getElementById('new-exam-btn').addEventListener('click', () => window.location.href = 'create-exam.html');
    
    // Kiểm tra đăng nhập
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadExams();
            loadResults();
        } else {
            alert('Vui lòng đăng nhập để xem trang quản lý');
            window.location.href = 'login.html';
        }
    });
    
    // Hàm chuyển tab
    function switchTab(tabName) {
        if (tabName === 'my-exams') {
            document.getElementById('tab-my-exams').classList.add('text-purple-600', 'border-purple-600');
            document.getElementById('tab-my-exams').classList.remove('text-gray-500');
            document.getElementById('tab-my-results').classList.add('text-gray-500');
            document.getElementById('tab-my-results').classList.remove('text-purple-600', 'border-purple-600');
            
            document.getElementById('my-exams-tab').classList.remove('hidden');
            document.getElementById('my-results-tab').classList.add('hidden');
        } else {
            document.getElementById('tab-my-results').classList.add('text-purple-600', 'border-purple-600');
            document.getElementById('tab-my-results').classList.remove('text-gray-500');
            document.getElementById('tab-my-exams').classList.add('text-gray-500');
            document.getElementById('tab-my-exams').classList.remove('text-purple-600', 'border-purple-600');
            
            document.getElementById('my-results-tab').classList.remove('hidden');
            document.getElementById('my-exams-tab').classList.add('hidden');
        }
    }
    
    // Hàm tải danh sách đề thi
    async function loadExams() {
        const examsList = document.getElementById('exams-list');
        examsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Đang tải dữ liệu...</td></tr>';
        
        try {
            const querySnapshot = await db.collection('exams')
                .where('createdBy', '==', currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();
            
            exams = [];
            querySnapshot.forEach(doc => {
                exams.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderExams();
        } catch (error) {
            console.error('Lỗi khi tải danh sách đề thi:', error);
            examsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-600">Có lỗi xảy ra khi tải dữ liệu</td></tr>';
        }
    }
    
    // Hàm hiển thị danh sách đề thi
    function renderExams() {
        const examsList = document.getElementById('exams-list');
        
        if (exams.length === 0) {
            examsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Bạn chưa tạo đề thi nào</td></tr>';
            return;
        }
        
        examsList.innerHTML = '';
        
        exams.forEach(exam => {
            const date = exam.createdAt.toDate();
            const dateStr = date.toLocaleDateString('vi-VN');
            
            // Đếm số người đã thi
            let participantsCount = 0;
            if (exam.participants) {
                participantsCount = exam.participants.length;
            }
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-gray-900">${exam.title}</div>
                    <div class="text-sm text-gray-500">${exam.description || 'Không có mô tả'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${exam.duration} phút</td>
                <td class="px-6 py-4 whitespace-nowrap">${dateStr}</td>
                <td class="px-6 py-4 whitespace-nowrap">${participantsCount}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="view-exam-btn text-purple-600 hover:text-purple-900 mr-3" data-id="${exam.id}">Xem</button>
                    <button class="delete-exam-btn text-red-600 hover:text-red-900" data-id="${exam.id}">Xóa</button>
                </td>
            `;
            
            examsList.appendChild(row);
        });
        
        // Thêm sự kiện cho nút xem/xóa
        document.querySelectorAll('.view-exam-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                viewExam(this.dataset.id);
            });
        });
        
        document.querySelectorAll('.delete-exam-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteExam(this.dataset.id);
            });
        });
    }
    
    // Hàm xem chi tiết đề thi
    async function viewExam(examId) {
        currentExam = exams.find(exam => exam.id === examId);
        
        if (!currentExam) {
            try {
                const examDoc = await db.collection('exams').doc(examId).get();
                currentExam = {
                    id: examDoc.id,
                    ...examDoc.data()
                };
            } catch (error) {
                console.error('Lỗi khi tải chi tiết đề thi:', error);
                alert('Có lỗi xảy ra khi tải đề thi');
                return;
            }
        }
        
        // Hiển thị thông tin đề thi
        document.getElementById('exam-detail-title').textContent = currentExam.title;
        document.getElementById('exam-detail-description').textContent = currentExam.description || 'Không có mô tả';
        document.getElementById('exam-detail-duration').textContent = `${currentExam.duration} phút`;
        
        const date = currentExam.createdAt.toDate();
        document.getElementById('exam-detail-date').textContent = date.toLocaleDateString('vi-VN');
        
        // Hiển thị câu hỏi
        const questionsContainer = document.getElementById('exam-detail-questions');
        questionsContainer.innerHTML = '';
        
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
                <div>
                    <p class="font-bold text-gray-700"><span class="text-blue-600">Câu ${index + 1}:</span> ${question.content}</p>
                    <p class="text-sm text-gray-500 mt-1">Dạng câu hỏi: ${getQuestionTypeName(question.type)} • Điểm: ${question.points}</p>
                    ${optionsHtml}
                </div>
            `;
            
            questionsContainer.appendChild(questionDiv);
        });
        
        // Hiển thị cài đặt
        document.getElementById('anti-copy-setting').textContent = `Chống sao chép: ${currentExam.settings.antiCopy ? 'Bật' : 'Tắt'}`;
        document.getElementById('anti-tab-setting').textContent = `Chống chuyển tab: ${currentExam.settings.antiTab ? 'Bật' : 'Tắt'}`;
        document.getElementById('timer-setting').textContent = `Hiển thị đồng hồ: ${currentExam.settings.showTimer ? 'Bật' : 'Tắt'}`;
        document.getElementById('random-setting').textContent = `Xáo trộn câu hỏi: ${currentExam.settings.randomOrder ? 'Bật' : 'Tắt'}`;
        
        // Tải danh sách bài thi
        loadExamParticipants();
        
        // Hiển thị modal
        document.getElementById('exam-detail-modal').classList.remove('hidden');
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
    
    // Hàm tải danh sách người thi
    async function loadExamParticipants() {
        const participantsContainer = document.getElementById('exam-participants');
        participantsContainer.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center">Đang tải dữ liệu...</td></tr>';
        
        try {
            const querySnapshot = await db.collection('exam_results')
                .where('examId', '==', currentExam.id)
                .orderBy('submittedAt', 'desc')
                .get();
            
            let totalParticipants = 0;
            let totalScore = 0;
            let highestScore = 0;
            
            participantsContainer.innerHTML = '';
            
            querySnapshot.forEach(doc => {
                const result = doc.data();
                totalParticipants++;
                
                if (result.score) {
                    totalScore += result.score;
                    if (result.score > highestScore) {
                        highestScore = result.score;
                    }
                }
                
                const date = result.submittedAt.toDate();
                const dateStr = date.toLocaleDateString('vi-VN');
                
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-4 py-4 whitespace-nowrap">
                        <div class="font-medium">${result.studentName}</div>
                        ${result.studentClass ? `<div class="text-sm text-gray-500">${result.studentClass}</div>` : ''}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap">${dateStr}</td>
                    <td class="px-4 py-4 whitespace-nowrap">
                        ${result.score ? `<span class="font-bold">${result.score.toFixed(1)}</span>/10` : 'Chưa chấm'}
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap">
                        ${result.score ? 
                            `<span class="px-2 py-1 text-xs rounded-full ${result.score >= 8 ? 'bg-green-100 text-green-800' : result.score >= 6 ? 'bg-blue-100 text-blue-800' : result.score >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}">
                                ${getScoreStatus(result.score)}
                            </span>` : 
                            '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Chờ chấm</span>'
                        }
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="grade-exam-btn text-purple-600 hover:text-purple-900 mr-2" data-id="${doc.id}">
                            ${result.score ? 'Xem' : 'Chấm'}
                        </button>
                    </td>
                `;
                
                participantsContainer.appendChild(row);
            });
            
            // Cập nhật thống kê
            document.getElementById('total-participants').textContent = totalParticipants;
            document.getElementById('average-score').textContent = totalParticipants > 0 ? (totalScore / totalParticipants).toFixed(1) : '0.0';
            document.getElementById('highest-score').textContent = highestScore.toFixed(1);
            
            // Thêm sự kiện cho nút chấm/xem
            document.querySelectorAll('.grade-exam-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    viewExamResult(this.dataset.id);
                });
            });
        } catch (error) {
            console.error('Lỗi khi tải danh sách người thi:', error);
            participantsContainer.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-red-600">Có lỗi xảy ra khi tải dữ liệu</td></tr>';
        }
    }
    
    // Hàm lấy trạng thái điểm
    function getScoreStatus(score) {
        if (score >= 8) return 'Xuất sắc';
        if (score >= 6) return 'Khá';
        if (score >= 4) return 'Trung bình';
        return 'Yếu';
    }
    
    // Hàm xóa đề thi
    async function deleteExam(examId) {
        if (!confirm('Bạn có chắc muốn xóa đề thi này? Tất cả bài làm liên quan cũng sẽ bị xóa.')) {
            return;
        }
        
        try {
            // Xóa đề thi
            await db.collection('exams').doc(examId).delete();
            
            // Xóa tất cả bài làm liên quan
            const resultsSnapshot = await db.collection('exam_results')
                .where('examId', '==', examId)
                .get();
            
            const batch = db.batch();
            resultsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            // Cập nhật danh sách
            exams = exams.filter(exam => exam.id !== examId);
            renderExams();
            
            alert('Đã xóa đề thi thành công');
        } catch (error) {
            console.error('Lỗi khi xóa đề thi:', error);
            alert('Có lỗi xảy ra khi xóa đề thi');
        }
    }
    
    // Hàm tải danh sách bài thi đã tham gia
    async function loadResults() {
        const resultsList = document.getElementById('results-list');
        resultsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Đang tải dữ liệu...</td></tr>';
        
        try {
            const querySnapshot = await db.collection('exam_results')
                .where('userId', '==', currentUser.uid)
                .orderBy('submittedAt', 'desc')
                .get();
            
            results = [];
            querySnapshot.forEach(doc => {
                results.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderResults();
        } catch (error) {
            console.error('Lỗi khi tải danh sách bài thi:', error);
            resultsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-600">Có lỗi xảy ra khi tải dữ liệu</td></tr>';
        }
    }
    
    // Hàm hiển thị danh sách bài thi
    function renderResults() {
        const resultsList = document.getElementById('results-list');
        
        if (results.length === 0) {
            resultsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Bạn chưa tham gia bài thi nào</td></tr>';
            return;
        }
        
        resultsList.innerHTML = '';
        
        results.forEach(result => {
            const date = result.submittedAt.toDate();
            const dateStr = date.toLocaleDateString('vi-VN');
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-gray-900">${result.examTitle}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${dateStr}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${result.score ? `<span class="font-bold">${result.score.toFixed(1)}</span>/10` : 'Chưa chấm'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${result.score ? 
                        `<span class="px-2 py-1 text-xs rounded-full ${result.score >= 8 ? 'bg-green-100 text-green-800' : result.score >= 6 ? 'bg-blue-100 text-blue-800' : result.score >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}">
                            ${getScoreStatus(result.score)}
                        </span>` : 
                        '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Chờ chấm</span>'
                    }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="view-result-btn text-purple-600 hover:text-purple-900" data-id="${result.id}">Xem</button>
                </td>
            `;
            
            resultsList.appendChild(row);
        });
        
        // Thêm sự kiện cho nút xem
        document.querySelectorAll('.view-result-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                viewExamResult(this.dataset.id);
            });
        });
    }
    
    // Hàm xem chi tiết bài thi
    async function viewExamResult(resultId) {
        currentResult = results.find(result => result.id === resultId);
        
        if (!currentResult) {
            try {
                const resultDoc = await db.collection('exam_results').doc(resultId).get();
                currentResult = {
                    id: resultDoc.id,
                    ...resultDoc.data()
                };
            } catch (error) {
                console.error('Lỗi khi tải chi tiết bài thi:', error);
                alert('Có lỗi xảy ra khi tải bài thi');
                return;
            }
        }
        
        // Nếu là bài thi chưa chấm và là người tạo đề
        if (!currentResult.score && currentResult.examId && currentUser.uid === currentExam?.createdBy) {
            showGradeExamModal();
            return;
        }
        
        // Hiển thị thông tin bài thi
        document.getElementById('view-exam-name').textContent = currentResult.examTitle;
        document.getElementById('view-student-name').textContent = currentResult.studentName;
        
        const date = currentResult.submittedAt.toDate();
        document.getElementById('view-exam-date').textContent = date.toLocaleDateString('vi-VN');
        
        document.getElementById('view-exam-score').textContent = currentResult.score ? 
            `${currentResult.score.toFixed(1)}/10` : 'Chưa chấm';
        
        // Tải đề thi gốc để hiển thị câu hỏi
        try {
            let examData = null;
            
            if (currentResult.examId) {
                const examDoc = await db.collection('exams').doc(currentResult.examId).get();
                examData = examDoc.data();
            } else {
                // Nếu là đề thi AI, sử dụng dữ liệu đã lưu
                examData = {
                    questions: currentResult.questions || []
                };
            }
            
            // Hiển thị câu hỏi và câu trả lời
            const questionsContainer = document.getElementById('view-exam-questions');
            questionsContainer.innerHTML = '';
            
            examData.questions.forEach((question, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'question-card p-5';
                
                // Lấy câu trả lời của thí sinh
                const answer = currentResult.answers[question.number] || '';
                
                let answerHtml = '';
                if (question.type === 'multiple-choice') {
                    answerHtml = `<p class="mt-2"><strong>Trả lời:</strong> ${answer}</p>`;
                } else if (question.type === 'true-false') {
                    answerHtml = `<p class="mt-2"><strong>Trả lời:</strong> ${answer === 'true' ? 'Đúng' : 'Sai'}</p>`;
                } else {
                    answerHtml = `
                        <div class="mt-2">
                            <p class="font-medium">Trả lời:</p>
                            <div class="bg-gray-50 p-3 rounded-lg mt-1">${answer || 'Không có câu trả lời'}</div>
                        </div>
                    `;
                }
                
                questionDiv.innerHTML = `
                    <div>
                        <p class="font-bold text-gray-700"><span class="text-blue-600">Câu ${index + 1}:</span> ${question.content}</p>
                        <p class="text-sm text-gray-500 mt-1">Dạng câu hỏi: ${getQuestionTypeName(question.type)} • Điểm: ${question.points}</p>
                        ${answerHtml}
                    </div>
                `;
                
                questionsContainer.appendChild(questionDiv);
            });
            
            // Hiển thị nhận xét nếu có
            const feedbackContainer = document.getElementById('view-feedback-content');
            if (currentResult.feedback) {
                feedbackContainer.innerHTML = currentResult.feedback;
                document.getElementById('view-exam-feedback').classList.remove('hidden');
            } else {
                document.getElementById('view-exam-feedback').classList.add('hidden');
            }
            
            // Hiển thị modal
            document.getElementById('view-exam-modal').classList.remove('hidden');
        } catch (error) {
            console.error('Lỗi khi tải đề thi gốc:', error);
            alert('Có lỗi xảy ra khi tải đề thi');
        }
    }
    
    // Hàm hiển thị modal chấm bài
    function showGradeExamModal() {
        document.getElementById('grade-exam-modal').classList.remove('hidden');
        
        // Hiển thị thông tin thí sinh
        document.getElementById('grade-student-name').textContent = currentResult.studentName;
        
        const date = currentResult.submittedAt.toDate();
        document.getElementById('grade-exam-date').textContent = date.toLocaleDateString('vi-VN');
        
        // Hiển thị câu hỏi và câu trả lời
        const questionsContainer = document.getElementById('grade-exam-questions');
        questionsContainer.innerHTML = '';
        
        currentExam.questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-card p-5';
            
            // Lấy câu trả lời của thí sinh
            const answer = currentResult.answers[question.number] || '';
            
            let answerHtml = '';
            if (question.type === 'multiple-choice') {
                answerHtml = `<p class="mt-2"><strong>Trả lời:</strong> ${answer}</p>`;
            } else if (question.type === 'true-false') {
                answerHtml = `<p class="mt-2"><strong>Trả lời:</strong> ${answer === 'true' ? 'Đúng' : 'Sai'}</p>`;
            } else {
                answerHtml = `
                    <div class="mt-2">
                        <p class="font-medium">Trả lời:</p>
                        <div class="bg-gray-50 p-3 rounded-lg mt-1">${answer || 'Không có câu trả lời'}</div>
                    </div>
                `;
            }
            
            questionDiv.innerHTML = `
                <div>
                    <p class="font-bold text-gray-700"><span class="text-blue-600">Câu ${index + 1}:</span> ${question.content}</p>
                    <p class="text-sm text-gray-500 mt-1">Dạng câu hỏi: ${getQuestionTypeName(question.type)} • Điểm: ${question.points}</p>
                    ${answerHtml}
                </div>
            `;
            
            questionsContainer.appendChild(questionDiv);
        });
    }
    
    // Thêm các sự kiện cho modal chấm bài
    document.getElementById('grade-ai-btn').addEventListener('click', gradeWithAI);
    document.getElementById('grade-assist-btn').addEventListener('click', gradeWithAIAssistance);
    document.getElementById('grade-manual-btn').addEventListener('click', gradeManually);
    document.getElementById('apply-ai-grade-btn').addEventListener('click', applyAIGrade);
    document.getElementById('save-grade-btn').addEventListener('click', saveGrade);
    document.getElementById('cancel-grade-btn').addEventListener('click', closeGradeExamModal);
    document.getElementById('close-grade-exam-btn').addEventListener('click', closeGradeExamModal);
    
    // Hàm chấm điểm bằng AI
    async function gradeWithAI() {
        document.getElementById('grade-ai-btn').disabled = true;
        document.getElementById('grade-ai-btn').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang chấm...';
        
        try {
            // Giả lập gọi API AI để chấm điểm
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Giả lập kết quả
            const score = Math.random() * 5 + 5; // Điểm từ 5-10
            const feedback = `
                <p class="font-medium mb-2">Điểm số đề xuất: ${score.toFixed(1)}/10</p>
                <p class="mb-2">Bài làm của học sinh có những ưu điểm sau:</p>
                <ul class="list-disc list-inside mb-2">
                    <li>Trả lời đầy đủ các câu hỏi</li>
                    <li>Diễn đạt rõ ràng, mạch lạc</li>
                </ul>
                <p>Những điểm cần cải thiện:</p>
                <ul class="list-disc list-inside">
                    <li>Cần phân tích sâu hơn ở câu nghị luận</li>
                    <li>Một số lỗi chính tả nhỏ</li>
                </ul>
            `;
            
            document.getElementById('ai-feedback-content').innerHTML = feedback;
            document.getElementById('ai-feedback-container').classList.remove('hidden');
        } catch (error) {
            console.error('Lỗi khi chấm điểm bằng AI:', error);
            alert('Có lỗi xảy ra khi chấm điểm. Vui lòng thử lại.');
        } finally {
            document.getElementById('grade-ai-btn').disabled = false;
            document.getElementById('grade-ai-btn').innerHTML = '<i class="fas fa-robot mr-1"></i> Chấm tự động';
        }
    }
    
    // Hàm chấm điểm với sự hỗ trợ của AI
    async function gradeWithAIAssistance() {
        document.getElementById('grade-assist-btn').disabled = true;
        document.getElementById('grade-assist-btn').innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang phân tích...';
        
        try {
            // Giả lập gọi API AI để phân tích
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Giả lập kết quả
            const feedback = `
                <p class="font-medium mb-2">Gợi ý chấm điểm:</p>
                <div class="mb-3 p-3 bg-yellow-50 rounded-lg">
                    <p class="font-medium text-yellow-700 mb-1">Câu 1:</p>
                    <p>Học sinh trả lời đúng phương thức biểu đạt (1/1 điểm)</p>
                </div>
                <div class="p-3 bg-yellow-50 rounded-lg">
                    <p class="font-medium text-yellow-700 mb-1">Câu 2:</p>
                    <p>Bài làm phân tích khá tốt nhưng còn thiếu phần liên hệ bản thân (3.5/4 điểm)</p>
                </div>
                <p class="mt-3">Tổng điểm đề xuất: <strong>8.5/10</strong></p>
            `;
            
            document.getElementById('ai-feedback-content').innerHTML = feedback;
            document.getElementById('ai-feedback-container').classList.remove('hidden');
        } catch (error) {
            console.error('Lỗi khi phân tích bài làm:', error);
            alert('Có lỗi xảy ra khi phân tích. Vui lòng thử lại.');
        } finally {
            document.getElementById('grade-assist-btn').disabled = false;
            document.getElementById('grade-assist-btn').innerHTML = '<i class="fas fa-magic mr-1"></i> Hỗ trợ chấm';
        }
    }
    
    // Hàm chấm điểm thủ công
    function gradeManually() {
        const score = parseFloat(document.getElementById('manual-grade').value);
        
        if (isNaN(score) {
            alert('Vui lòng nhập điểm số hợp lệ');
            return;
        }
        
        if (score < 0 || score > 10) {
            alert('Điểm số phải từ 0 đến 10');
            return;
        }
        
        // Hiển thị xác nhận
        if (confirm(`Xác nhận chấm điểm ${score.toFixed(1)}/10 cho bài thi này?`)) {
            currentResult.score = score;
            currentResult.gradedAt = firebase.firestore.FieldValue.serverTimestamp();
            
            // Đóng modal và cập nhật danh sách
            closeGradeExamModal();
            loadExamParticipants();
            loadResults();
            
            alert('Đã lưu điểm thành công');
        }
    }
    
    // Hàm áp dụng điểm từ AI
    function applyAIGrade() {
        // Trong thực tế, bạn sẽ lấy điểm từ phản hồi AI
        const score = 8.5;
        document.getElementById('manual-grade').value = score;
    }
    
    // Hàm lưu điểm
    async function saveGrade() {
        const score = parseFloat(document.getElementById('manual-grade').value);
        
        if (isNaN(score)) {
            alert('Vui lòng nhập điểm số hợp lệ');
            return;
        }
        
        if (score < 0 || score > 10) {
            alert('Điểm số phải từ 0 đến 10');
            return;
        }
        
        try {
            await db.collection('exam_results').doc(currentResult.id).update({
                score: score,
                gradedAt: firebase.firestore.FieldValue.serverTimestamp(),
                feedback: document.getElementById('ai-feedback-content').textContent
            });
            
            // Đóng modal và cập nhật danh sách
            closeGradeExamModal();
            loadExamParticipants();
            loadResults();
            
            alert('Đã lưu điểm thành công');
        } catch (error) {
            console.error('Lỗi khi lưu điểm:', error);
            alert('Có lỗi xảy ra khi lưu điểm. Vui lòng thử lại.');
        }
    }
    
    // Hàm đóng modal chấm bài
    function closeGradeExamModal() {
        document.getElementById('grade-exam-modal').classList.add('hidden');
        document.getElementById('ai-feedback-container').classList.add('hidden');
        document.getElementById('manual-grade').value = '';
    }
    
    // Thêm sự kiện cho các nút trong modal xem đề thi
    document.getElementById('close-exam-modal-btn').addEventListener('click', closeExamDetailModal);
    document.getElementById('close-exam-detail-btn').addEventListener('click', closeExamDetailModal);
    document.getElementById('share-exam-modal-btn').addEventListener('click', shareExam);
    document.getElementById('delete-exam-modal-btn').addEventListener('click', () => deleteExam(currentExam.id));
    
    // Thêm sự kiện cho modal xem bài thi
    document.getElementById('close-view-modal-btn').addEventListener('click', closeViewExamModal);
    document.getElementById('close-view-exam-btn').addEventListener('click', closeViewExamModal);
    
    // Hàm đóng modal xem đề thi
    function closeExamDetailModal() {
        document.getElementById('exam-detail-modal').classList.add('hidden');
    }
    
    // Hàm đóng modal xem bài thi
    function closeViewExamModal() {
        document.getElementById('view-exam-modal').classList.add('hidden');
    }
    
    // Hàm chia sẻ đề thi
    function shareExam() {
        const examLink = `${window.location.origin}/take-exam.html?examId=${currentExam.id}`;
        
        document.getElementById('share-exam-link').value = examLink;
        
        // Tạo QR code
        const qrCodeDiv = document.getElementById('share-qr-code');
        qrCodeDiv.innerHTML = '';
        new QRCode(qrCodeDiv, {
            text: examLink,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Cập nhật link chia sẻ
        document.getElementById('share-fb-btn').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(examLink)}`;
        document.getElementById('share-zalo-btn').href = `https://zalo.me/share?text=${encodeURIComponent('Tham gia đề thi: ' + currentExam.title)}&url=${encodeURIComponent(examLink)}`;
        
        // Hiển thị modal chia sẻ
        document.getElementById('share-modal').classList.remove('hidden');
    }
    
    // Thêm sự kiện cho modal chia sẻ
    document.getElementById('copy-share-link-btn').addEventListener('click', copyShareLink);
    document.getElementById('close-share-btn').addEventListener('click', closeShareModal);
    document.getElementById('close-share-modal-btn').addEventListener('click', closeShareModal);
    
    // Hàm sao chép link chia sẻ
    function copyShareLink() {
        const linkInput = document.getElementById('share-exam-link');
        linkInput.select();
        document.execCommand('copy');
        
        alert('Đã sao chép link vào clipboard!');
    }
    
    // Hàm đóng modal chia sẻ
    function closeShareModal() {
        document.getElementById('share-modal').classList.add('hidden');
    }
});