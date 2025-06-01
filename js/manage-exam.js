document.addEventListener('DOMContentLoaded', function() {
    // Biến toàn cục
    let currentTab = 'my-exams';
    let currentExam = null;
    let currentResult = null;
    
    // DOM Elements
    const tabButtons = {
        'my-exams': document.getElementById('tab-my-exams'),
        'my-results': document.getElementById('tab-my-results')
    };
    
    const tabContents = {
        'my-exams': document.getElementById('my-exams-content'),
        'my-results': document.getElementById('my-results-content')
    };
    
    // Xử lý chuyển tab
    tabButtons['my-exams'].addEventListener('click', () => switchTab('my-exams'));
    tabButtons['my-results'].addEventListener('click', () => switchTab('my-results'));
    
    // Xử lý tạo đề mới
    document.getElementById('create-new-exam').addEventListener('click', function() {
        window.location.href = 'create-exam.html';
    });
    
    // Tải dữ liệu ban đầu
    loadMyExams();
    loadMyResults();
    
    // Các hàm hỗ trợ
    function switchTab(tabName) {
        if (currentTab === tabName) return;
        
        // Cập nhật UI
        tabButtons[currentTab].classList.remove('active');
        tabContents[currentTab].classList.add('hidden');
        
        tabButtons[tabName].classList.add('active');
        tabContents[tabName].classList.remove('hidden');
        
        currentTab = tabName;
    }
    
    function loadMyExams() {
        const user = auth.currentUser;
        if (!user) return;
        
        const examsList = document.getElementById('exams-list');
        examsList.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center">Đang tải dữ liệu...</td></tr>';
        
        db.collection('exams')
            .where('createdBy', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    examsList.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center">Bạn chưa tạo đề thi nào</td></tr>';
                    return;
                }
                
                examsList.innerHTML = '';
                
                querySnapshot.forEach(doc => {
                    const exam = doc.data();
                    exam.id = doc.id;
                    
                    // Đếm số người thi
                    getExamParticipantsCount(exam.id).then(count => {
                        const examRow = createExamRow(exam, count);
                        examsList.appendChild(examRow);
                    });
                });
            })
            .catch(error => {
                console.error('Lỗi khi tải danh sách đề thi:', error);
                examsList.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-600">Có lỗi xảy ra khi tải dữ liệu</td></tr>';
            });
    }
    
    function getExamParticipantsCount(examId) {
        return db.collection('exam_results')
            .where('examId', '==', examId)
            .get()
            .then(querySnapshot => querySnapshot.size);
    }
    
    function createExamRow(exam, participantsCount) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 cursor-pointer';
        row.dataset.examId = exam.id;
        
        const createdAt = exam.createdAt?.toDate() || new Date();
        const dateStr = createdAt.toLocaleDateString('vi-VN');
        const timeStr = createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${exam.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${dateStr} ${timeStr}</td>
            <td class="px-6 py-4 whitespace-nowrap">${participantsCount}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button class="view-exam text-blue-600 hover:text-blue-800 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="delete-exam text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        // Thêm sự kiện xem chi tiết
        row.querySelector('.view-exam').addEventListener('click', (e) => {
            e.stopPropagation();
            showExamDetail(exam);
        });
        
        // Thêm sự kiện xóa
        row.querySelector('.delete-exam').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteExam(exam.id);
        });
        
        // Thêm sự kiện click vào hàng
        row.addEventListener('click', () => {
            showExamDetail(exam);
        });
        
        return row;
    }
    
    function showExamDetail(exam) {
        currentExam = exam;
        
        // Hiển thị thông tin cơ bản
        document.getElementById('detail-exam-name').textContent = exam.name;
        document.getElementById('detail-exam-duration').textContent = `${exam.duration} phút`;
        document.getElementById('detail-exam-description').textContent = exam.description || 'Không có mô tả';
        
        // Đếm số câu hỏi
        const questionCount = exam.questions?.length || 0;
        document.getElementById('detail-exam-questions').textContent = questionCount;
        
        // Tải danh sách bài thi
        loadExamResults(exam.id);
        
        // Hiển thị panel chi tiết
        document.getElementById('exam-detail').classList.remove('hidden');
        
        // Cuộn đến phần chi tiết
        document.getElementById('exam-detail').scrollIntoView({ behavior: 'smooth' });
    }
    
    function loadExamResults(examId) {
        const resultsList = document.getElementById('exam-results-list');
        resultsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Đang tải dữ liệu...</td></tr>';
        
        // Đếm số người thi lại
        getExamParticipantsCount(examId).then(count => {
            document.getElementById('detail-exam-participants').textContent = count;
        });
        
        db.collection('exam_results')
            .where('examId', '==', examId)
            .orderBy('submittedAt', 'desc')
            .get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    resultsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Chưa có bài thi nào</td></tr>';
                    return;
                }
                
                resultsList.innerHTML = '';
                
                querySnapshot.forEach(doc => {
                    const result = doc.data();
                    result.id = doc.id;
                    
                    const resultRow = createExamResultRow(result);
                    resultsList.appendChild(resultRow);
                });
            })
            .catch(error => {
                console.error('Lỗi khi tải danh sách bài thi:', error);
                resultsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-600">Có lỗi xảy ra khi tải dữ liệu</td></tr>';
            });
    }
    
    function createExamResultRow(result) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.dataset.resultId = result.id;
        
        const submittedAt = result.submittedAt?.toDate() || new Date();
        const dateStr = submittedAt.toLocaleDateString('vi-VN');
        const timeStr = submittedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        let statusBadge = '';
        let scoreText = '';
        
        if (result.status === 'graded') {
            statusBadge = '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Đã chấm</span>';
            scoreText = result.score ? result.score.toFixed(1) + '/10' : '--';
        } else {
            statusBadge = '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Chờ chấm</span>';
            scoreText = '--';
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${result.studentInfo?.name || 'Không tên'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${dateStr} ${timeStr}</td>
            <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
            <td class="px-6 py-4 whitespace-nowrap">${scoreText}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button class="grade-exam text-blue-600 hover:text-blue-800 mr-3">
                    <i class="fas fa-check-circle"></i>
                </button>
                <button class="view-result text-purple-600 hover:text-purple-800">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        // Thêm sự kiện chấm điểm
        if (result.status !== 'graded') {
            row.querySelector('.grade-exam').addEventListener('click', (e) => {
                e.stopPropagation();
                showGradeModal(result);
            });
        } else {
            row.querySelector('.grade-exam').style.display = 'none';
        }
        
        // Thêm sự kiện xem bài thi
        row.querySelector('.view-result').addEventListener('click', (e) => {
            e.stopPropagation();
            viewExamResult(result);
        });
        
        return row;
    }
    
    function showGradeModal(result) {
        currentResult = result;
        
        const gradeContent = document.getElementById('grade-content');
        gradeContent.innerHTML = '';
        
        // Hiển thị thông tin thí sinh
        const studentInfoHtml = `
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 class="font-bold mb-2">Thông tin thí sinh</h3>
                <p>Họ tên: ${result.studentInfo?.name || 'Không có'}</p>
                ${result.studentInfo?.email ? `<p>Email: ${result.studentInfo.email}</p>` : ''}
                ${result.studentInfo?.phone ? `<p>SĐT: ${result.studentInfo.phone}</p>` : ''}
            </div>
        `;
        gradeContent.insertAdjacentHTML('beforeend', studentInfoHtml);
        
        // Hiển thị câu hỏi và câu trả lời
        if (currentExam?.questions) {
            currentExam.questions.forEach((question, index) => {
                const answer = result.answers?.[question.id]?.answer || 'Không có câu trả lời';
                
                const questionHtml = `
                    <div class="border-b pb-4 mb-4">
                        <h4 class="font-bold mb-2">Câu ${index + 1}: ${question.content}</h4>
                        <div class="bg-gray-50 p-3 rounded-lg mb-3">
                            <p class="text-gray-700 mb-1">Câu trả lời:</p>
                            <p class="whitespace-pre-line">${answer}</p>
                        </div>
                        <div class="flex items-center justify-between">
                            <label class="block text-gray-700 mr-2">Điểm:</label>
                            <input type="number" class="question-grade w-20 p-2 border rounded" min="0" max="10" step="0.1" placeholder="0.0">
                        </div>
                    </div>
                `;
                
                gradeContent.insertAdjacentHTML('beforeend', questionHtml);
            });
        }
        
        // Hiển thị modal
        document.getElementById('grade-modal').classList.remove('hidden');
    }
    
    function closeGradeModal() {
        document.getElementById('grade-modal').classList.add('hidden');
        currentResult = null;
    }
    
    // Xử lý đóng modal
    document.getElementById('close-grade-modal').addEventListener('click', closeGradeModal);
    document.getElementById('cancel-grade').addEventListener('click', closeGradeModal);
    
    // Xử lý lưu điểm
    document.getElementById('save-grade').addEventListener('click', function() {
        const totalGrade = parseFloat(document.getElementById('total-grade').value);
        const feedback = document.getElementById('grade-feedback').value.trim();
        
        if (isNaN(totalGrade) {
            alert('Vui lòng nhập điểm tổng hợp');
            return;
        }
        
        // Thu thập điểm từng câu
        const questionGrades = {};
        let questionIndex = 0;
        
        document.querySelectorAll('.question-grade').forEach(input => {
            const grade = parseFloat(input.value) || 0;
            const questionId = currentExam.questions[questionIndex].id;
            questionGrades[questionId] = grade;
            questionIndex++;
        });
        
        // Cập nhật kết quả
        db.collection('exam_results').doc(currentResult.id).update({
            status: 'graded',
            score: totalGrade,
            questionGrades: questionGrades,
            feedback: feedback,
            gradedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            alert('Đã lưu điểm thành công!');
            closeGradeModal();
            loadExamResults(currentExam.id);
        })
        .catch(error => {
            console.error('Lỗi khi lưu điểm:', error);
            alert('Có lỗi xảy ra khi lưu điểm. Vui lòng thử lại.');
        });
    });
    
    function viewExamResult(result) {
        currentResult = result;
        
        // Hiển thị thông tin cơ bản
        const submittedAt = result.submittedAt?.toDate() || new Date();
        const dateStr = submittedAt.toLocaleDateString('vi-VN');
        const timeStr = submittedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        document.getElementById('detail-result-name').textContent = result.examName || 'Không có tên';
        document.getElementById('detail-result-date').textContent = `${dateStr} ${timeStr}`;
        
        if (result.status === 'graded') {
            document.getElementById('detail-result-score').textContent = result.score ? result.score.toFixed(1) + '/10' : '--';
            document.getElementById('detail-result-feedback').textContent = result.feedback || 'Không có nhận xét';
        } else {
            document.getElementById('detail-result-score').textContent = 'Chờ chấm';
            document.getElementById('detail-result-feedback').textContent = 'Bài thi của bạn đang chờ được chấm điểm.';
        }
        
        // Hiển thị câu trả lời
        const answersContainer = document.getElementById('detail-result-answers');
        answersContainer.innerHTML = '';
        
        if (currentExam?.questions) {
            currentExam.questions.forEach((question, index) => {
                const answer = result.answers?.[question.id]?.answer || 'Không có câu trả lời';
                const grade = result.questionGrades?.[question.id] || '--';
                
                const answerHtml = `
                    <div class="bg-white p-4 rounded-lg shadow-sm">
                        <h4 class="font-bold mb-2">Câu ${index + 1}: ${question.content}</h4>
                        <div class="bg-gray-50 p-3 rounded-lg mb-3">
                            <p class="text-gray-700 mb-1">Câu trả lời:</p>
                            <p class="whitespace-pre-line">${answer}</p>
                        </div>
                        ${result.status === 'graded' ? `
                            <div class="flex justify-between items-center">
                                <span class="text-gray-700">Điểm:</span>
                                <span class="font-bold">${grade}</span>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                answersContainer.insertAdjacentHTML('beforeend', answerHtml);
            });
        }
        
        // Hiển thị panel chi tiết
        document.getElementById('result-detail').classList.remove('hidden');
        
        // Cuộn đến phần chi tiết
        document.getElementById('result-detail').scrollIntoView({ behavior: 'smooth' });
    }
    
    // Xử lý đóng chi tiết đề thi
    document.getElementById('close-exam-detail').addEventListener('click', function() {
        document.getElementById('exam-detail').classList.add('hidden');
        currentExam = null;
    });
    
    // Xử lý đóng chi tiết bài thi
    document.getElementById('close-result-detail').addEventListener('click', function() {
        document.getElementById('result-detail').classList.add('hidden');
        currentResult = null;
    });
    
    // Xử lý chia sẻ đề thi
    document.getElementById('share-exam').addEventListener('click', function() {
        if (!currentExam) return;
        
        const examLink = `${window.location.origin}/take-exam.html?examId=${currentExam.id}`;
        
        // TODO: Triển khai chức năng chia sẻ
        alert(`Link chia sẻ đề thi: ${examLink}\n\nSao chép link này để chia sẻ với người khác.`);
    });
    
    // Xử lý xóa đề thi
    document.getElementById('delete-exam').addEventListener('click', function() {
        if (!currentExam) return;
        
        if (confirm(`Bạn có chắc chắn muốn xóa đề thi "${currentExam.name}"? Thao tác này không thể hoàn tác.`)) {
            db.collection('exams').doc(currentExam.id).delete()
                .then(() => {
                    alert('Đã xóa đề thi thành công!');
                    document.getElementById('exam-detail').classList.add('hidden');
                    loadMyExams();
                })
                .catch(error => {
                    console.error('Lỗi khi xóa đề thi:', error);
                    alert('Có lỗi xảy ra khi xóa đề thi. Vui lòng thử lại.');
                });
        }
    });
    
    // Xử lý tải về bài làm
    document.getElementById('download-result').addEventListener('click', function() {
        if (!currentResult) return;
        
        // Tạo nội dung file
        let content = `KẾT QUẢ BÀI THI\n`;
        content += `Tên đề thi: ${currentResult.examName || 'Không có tên'}\n`;
        
        const submittedAt = currentResult.submittedAt?.toDate() || new Date();
        content += `Ngày thi: ${submittedAt.toLocaleDateString('vi-VN')}\n`;
        
        if (currentResult.status === 'graded') {
            content += `Điểm số: ${currentResult.score?.toFixed(1) || '--'}/10\n\n`;
            content += `Nhận xét: ${currentResult.feedback || 'Không có nhận xét'}\n\n`;
        } else {
            content += `Trạng thái: Chờ chấm\n\n`;
        }
        
        content += `BÀI LÀM CỦA BẠN\n\n`;
        
        if (currentExam?.questions) {
            currentExam.questions.forEach((question, index) => {
                const answer = currentResult.answers?.[question.id]?.answer || 'Không có câu trả lời';
                const grade = currentResult.questionGrades?.[question.id] || '--';
                
                content += `Câu ${index + 1}: ${question.content}\n`;
                content += `Câu trả lời:\n${answer}\n`;
                
                if (currentResult.status === 'graded') {
                    content += `Điểm: ${grade}\n`;
                }
                
                content += `\n`;
            });
        }
        
        // Tạo file và tải về
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bai-thi-${currentResult.examName || 'van-hoc'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Xử lý chấm điểm bằng AI
    document.getElementById('grade-with-ai').addEventListener('click', function() {
        if (!currentExam) return;
        
        // TODO: Gọi API AI để chấm điểm hàng loạt
        alert('Chức năng chấm điểm bằng AI đang được phát triển.');
    });
    
    // Xử lý AI hỗ trợ chấm điểm
    document.getElementById('ai-assist-grade').addEventListener('click', function() {
        if (!currentExam) return;
        
        // TODO: Gọi API AI để hỗ trợ chấm điểm
        alert('Chức năng AI hỗ trợ chấm điểm đang được phát triển.');
    });
    
    function loadMyResults() {
        const user = auth.currentUser;
        if (!user) return;
        
        const resultsList = document.getElementById('results-list');
        resultsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Đang tải dữ liệu...</td></tr>';
        
        db.collection('exam_results')
            .where('userId', '==', user.uid)
            .orderBy('submittedAt', 'desc')
            .get()
            .then(querySnapshot => {
                if (querySnapshot.empty) {
                    resultsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Bạn chưa tham gia bài thi nào</td></tr>';
                    return;
                }
                
                resultsList.innerHTML = '';
                
                querySnapshot.forEach(doc => {
                    const result = doc.data();
                    result.id = doc.id;
                    
                    // Lấy thông tin đề thi
                    db.collection('exams').doc(result.examId).get()
                        .then(examDoc => {
                            if (examDoc.exists) {
                                result.examData = examDoc.data();
                            }
                            
                            const resultRow = createMyResultRow(result);
                            resultsList.appendChild(resultRow);
                        })
                        .catch(error => {
                            console.error('Lỗi khi tải thông tin đề thi:', error);
                            
                            // Vẫn hiển thị kết quả ngay cả khi không tải được đề thi
                            const resultRow = createMyResultRow(result);
                            resultsList.appendChild(resultRow);
                        });
                });
            })
            .catch(error => {
                console.error('Lỗi khi tải danh sách bài thi:', error);
                resultsList.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-600">Có lỗi xảy ra khi tải dữ liệu</td></tr>';
            });
    }
    
    function createMyResultRow(result) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 cursor-pointer';
        row.dataset.resultId = result.id;
        
        const submittedAt = result.submittedAt?.toDate() || new Date();
        const dateStr = submittedAt.toLocaleDateString('vi-VN');
        const timeStr = submittedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        let statusBadge = '';
        let scoreText = '';
        
        if (result.status === 'graded') {
            statusBadge = '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Đã chấm</span>';
            scoreText = result.score ? result.score.toFixed(1) + '/10' : '--';
        } else {
            statusBadge = '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Chờ chấm</span>';
            scoreText = '--';
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${result.examName || result.examData?.name || 'Không tên'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${dateStr} ${timeStr}</td>
            <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
            <td class="px-6 py-4 whitespace-nowrap">${scoreText}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button class="view-result text-purple-600 hover:text-purple-800">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        
        // Thêm sự kiện xem chi tiết
        row.querySelector('.view-result').addEventListener('click', (e) => {
            e.stopPropagation();
            viewMyResult(result);
        });
        
        // Thêm sự kiện click vào hàng
        row.addEventListener('click', () => {
            viewMyResult(result);
        });
        
        return row;
    }
    
    function viewMyResult(result) {
        currentResult = result;
        
        // Hiển thị thông tin cơ bản
        const submittedAt = result.submittedAt?.toDate() || new Date();
        const dateStr = submittedAt.toLocaleDateString('vi-VN');
        const timeStr = submittedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        document.getElementById('detail-result-name').textContent = result.examName || result.examData?.name || 'Không có tên';
        document.getElementById('detail-result-date').textContent = `${dateStr} ${timeStr}`;
        
        if (result.status === 'graded') {
            document.getElementById('detail-result-score').textContent = result.score ? result.score.toFixed(1) + '/10' : '--';
            document.getElementById('detail-result-feedback').textContent = result.feedback || 'Không có nhận xét';
        } else {
            document.getElementById('detail-result-score').textContent = 'Chờ chấm';
            document.getElementById('detail-result-feedback').textContent = 'Bài thi của bạn đang chờ được chấm điểm.';
        }
        
        // Hiển thị câu trả lời
        const answersContainer = document.getElementById('detail-result-answers');
        answersContainer.innerHTML = '';
        
        if (result.examData?.questions) {
            result.examData.questions.forEach((question, index) => {
                const answer = result.answers?.[question.id]?.answer || 'Không có câu trả lời';
                const grade = result.questionGrades?.[question.id] || '--';
                
                const answerHtml = `
                    <div class="bg-white p-4 rounded-lg shadow-sm">
                        <h4 class="font-bold mb-2">Câu ${index + 1}: ${question.content}</h4>
                        <div class="bg-gray-50 p-3 rounded-lg mb-3">
                            <p class="text-gray-700 mb-1">Câu trả lời:</p>
                            <p class="whitespace-pre-line">${answer}</p>
                        </div>
                        ${result.status === 'graded' ? `
                            <div class="flex justify-between items-center">
                                <span class="text-gray-700">Điểm:</span>
                                <span class="font-bold">${grade}</span>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                answersContainer.insertAdjacentHTML('beforeend', answerHtml);
            });
        }
        
        // Hiển thị panel chi tiết
        document.getElementById('result-detail').classList.remove('hidden');
        
        // Cuộn đến phần chi tiết
        document.getElementById('result-detail').scrollIntoView({ behavior: 'smooth' });
    }
});