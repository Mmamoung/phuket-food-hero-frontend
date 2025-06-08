// --- Helper function for authenticated API calls ---
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers // รวม headers เดิม
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
        alert('เซสชันหมดอายุหรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        loadMainPage(); // Redirect to main page/login
        throw new Error('Unauthorized or Forbidden'); // Throw error to stop further execution
    }

    return response;
}

// --- Helper function to handle user login/registration ---
async function handleAuthSubmission(email, password, role, additionalData = {}) {
    const authData = { email, password, role, ...additionalData };
    let response;
    let result;

    try {
        // Attempt to register first
        // TODO: Update to your Render.com Backend URL
        response = await authenticatedFetch('https://phuket-food-hero-api.onrender.com/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authData)
        });

        result = await response.json();

        if (response.ok) {
            // Registration successful
            localStorage.setItem('token', result.token);
            localStorage.setItem('userRole', result.role);
            localStorage.setItem('userId', result._id);
            alert('ลงทะเบียนและเข้าสู่ระบบสำเร็จ!');
            if (result.role === 'school') {
                loadSchoolDashboard();
            } else if (result.role === 'farmer') {
                loadFarmerDashboard();
            }
            return; // Exit function
        } else if (response.status === 400 && result.msg === 'User นี้ลงทะเบียนแล้ว') {
            // User already registered, attempt to log in
            console.log('User already registered, attempting login...');
            // TODO: Update to your Render.com Backend URL
            response = await authenticatedFetch('https://phuket-food-hero-api.onrender.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }) // Only email and password for login
            });
            result = await response.json();

            if (response.ok) {
                // Login successful
                localStorage.setItem('token', result.token);
                localStorage.setItem('userRole', result.role);
                localStorage.setItem('userId', result._id);
                alert('เข้าสู่ระบบสำเร็จ!');
                if (result.role === 'school') {
                    loadSchoolDashboard();
                } else if (result.role === 'farmer') {
                    loadFarmerDashboard();
                }
                return; // Exit function
            } else {
                // Login failed after registration attempt
                alert('เข้าสู่ระบบล้มเหลว: ' + (result.msg || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
            }
        } else {
            // Other registration error
            alert('ลงทะเบียนไม่สำเร็จ: ' + (result.msg || 'เกิดข้อผิดพลาด'));
        }

    } catch (error) {
        console.error('Authentication Error:', error);
        if (error.message !== 'Unauthorized or Forbidden') {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    }
}

// --- Helper function for generic login attempt ---
async function genericLoginAttempt(email, password) {
    try {
        // TODO: Update to your Render.com Backend URL
        const response = await authenticatedFetch('https://phuket-food-hero-api.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('userRole', result.role);
            localStorage.setItem('userId', result._id);
            alert('เข้าสู่ระบบสำเร็จ!');
            if (result.role === 'school') {
                loadSchoolDashboard();
            } else if (result.role === 'farmer') {
                loadFarmerDashboard();
            }
        } else {
            alert('เข้าสู่ระบบล้มเหลว: ' + (result.msg || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
        }
    } catch (error) {
        console.error('Generic Login Error:', error);
        if (error.message !== 'Unauthorized or Forbidden') {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    }
}


// --- Helper function to render data blocks dynamically ---
async function renderDataBlocks(data, targetWrapperId) {
    const wrapper = document.querySelector(targetWrapperId);
    if (!wrapper) return;

    wrapper.innerHTML = ''; // Clear previous content

    console.log(`Rendering data blocks for ${targetWrapperId}. Data received:`, data); // Log data received

    if (data.length === 0) {
        wrapper.innerHTML = '<p style="color: #666; text-align: center; margin-top: 30px;">ไม่พบข้อมูล</p>';
        return;
    }

    const userRole = localStorage.getItem('userRole'); // Get current user's role
    const userId = localStorage.getItem('userId'); // Get current user's ID

    // Fetch user's stars for display
    let userStars = 0;
    try {
        // TODO: Update to your Render.com Backend URL and create this API in Backend (routes/auth.js)
        const profileResponse = await authenticatedFetch(`https://phuket-food-hero-api.onrender.com/api/auth/profile/${userId}`);
        const profileData = await profileResponse.json();
        userStars = profileData.stars || 0;
    } catch (error) {
        console.error('Failed to fetch user stars:', error);
    }
    // Update star display in sidebar
    const userStarsElement = document.querySelector('.user-stars');
    if (userStarsElement) {
        userStarsElement.textContent = `⭐ ${userStars} ดาว`;
    }


    data.forEach(item => {
        const dataBlock = document.createElement('div');
        dataBlock.classList.add('data-block');
        dataBlock.dataset.id = item._id;

        // Format date
        const date = new Date(item.date).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Format posted time
        const postedAt = new Date(item.postedAt).toLocaleTimeString('th-TH', {
            hour: '2-digit', minute: '2-digit'
        });

        dataBlock.innerHTML = `
            <img src="${item.imageUrl || 'https://placehold.co/150x120/ADD8E6/000000?text=No+Image'}" alt="Waste Image" class="data-item-image">
            <div class="data-item-details">
                <p><strong>เมนู:</strong> ${item.menu}</p>
                <p><strong>ปริมาณ:</strong> ${item.weight} kg</p>
                <p><strong>วันที่:</strong> ${date} (${postedAt})</p>
                <p><strong>จาก:</strong> ${item.school ? item.school.instituteName : 'ไม่ระบุโรงเรียน'}</p>
                <p><strong>ติดต่อ:</strong> ${item.school ? item.school.contactNumber : 'ไม่ระบุ'}</p>
            </div>
            ${userRole === 'school' && item.school && item.school._id === userId ? `<button class="delete-button" data-id="${item._id}">ลบ</button>` : ''}
            ${userRole === 'farmer' && !item.isReceived ? `
                <button class="receive-waste-button" data-id="${item._id}">รับเศษอาหาร</button>
                <button class="details-button" data-id="${item._id}">รายละเอียด</button>
                ` : ''}
            ${userRole === 'farmer' && item.isReceived ? `
                <p class="received-status">รับแล้วโดยคุณ</p>
                <button class="details-button" data-id="${item._id}">รายละเอียด</button>
            `: ''}
        `;
        wrapper.appendChild(dataBlock);
    });

    // Attach delete button listeners for school dashboard
    if (userRole === 'school' && targetWrapperId === '#schoolDataBlocks') {
        wrapper.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const wasteId = e.target.dataset.id;
                showConfirmationModal('คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?', () => deleteWasteEntry(wasteId));
            });
        });
    }

    // Attach details button listeners for farmer dashboard
    if (userRole === 'farmer' && targetWrapperId === '#farmerDataBlocks') {
        wrapper.querySelectorAll('.details-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = e.target.dataset.id;
                loadPostDetails(postId);
            });
        });
        // Attach receive waste button listeners for farmer dashboard
        wrapper.querySelectorAll('.receive-waste-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const wasteId = e.target.dataset.id;
                showConfirmationModal('คุณต้องการรับเศษอาหารนี้หรือไม่?', () => handleReceiveWaste(wasteId));
            });
        });
    }

    // NEW: Attach QR Scan button listeners for school pending delivery page
    if (userRole === 'school' && targetWrapperId === '#pendingDeliveryBlocks') {
        wrapper.querySelectorAll('.scan-qr-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const wasteId = e.target.dataset.id;
                loadQRCodeDisplayPage(wasteId); // Show QR code for this item
            });
        });
    }
}

// --- Custom Confirmation Modal ---
function showConfirmationModal(message, onConfirm) {
    const modalHtml = `
        <div class="custom-modal-overlay" id="confirmationModalOverlay">
            <div class="custom-modal-content">
                <p>${message}</p>
                <div class="modal-buttons">
                    <button id="confirmYes" class="modal-button modal-button-yes">ใช่</button>
                    <button id="confirmNo" class="modal-button modal-button-no">ไม่</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('confirmYes').addEventListener('click', () => {
        onConfirm();
        document.getElementById('confirmationModalOverlay').remove();
    });
    document.getElementById('confirmNo').addEventListener('click', () => {
        document.getElementById('confirmationModalOverlay').remove();
    });
}

// --- Delete Waste Entry Function ---
async function deleteWasteEntry(id) {
    console.log('Frontend attempting to delete ID:', id);
    try {
        // TODO: Update to your Render.com Backend URL
        const response = await authenticatedFetch(`https://phuket-food-hero-api.onrender.com/api/waste/${id}`, {
            method: 'DELETE'
        });

        const contentType = response.headers.get('content-type');
        let result;
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            result = await response.text();
            console.error('Backend responded with non-JSON for delete:', result);
        }

        if (response.ok) {
            alert('ลบข้อมูลสำเร็จ!');
            loadSchoolDashboard();
        } else {
            alert('ลบข้อมูลไม่สำเร็จ: ' + (result.msg || result || 'เกิดข้อผิดพลาดที่ไม่รู้จัก'));
        }
    } catch (error) {
        console.error('Delete Waste Error:', error);
        if (error.message !== 'Unauthorized or Forbidden') {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    }
}

// Handle Receive Waste Function (for Farmer)
async function handleReceiveWaste(wasteId) {
    console.log(`Frontend sending receive request for ID: ${wasteId}`);
    try {
        // TODO: Update to your Render.com Backend URL
        const response = await authenticatedFetch(`https://phuket-food-hero-api.onrender.com/api/waste/receive/${wasteId}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('ยืนยันการรับเศษอาหารสำเร็จ!');
            loadFarmerDashboard(); // Reload dashboard to reflect changes (e.g., stars)
        } else {
            const errorData = await response.json();
            alert('ยืนยันการรับเศษอาหารไม่สำเร็จ: ' + (errorData.msg || 'เกิดข้อผิดพลาด'));
        }
    } catch (error) {
        console.error('Receive Waste Error:', error);
        if (error.message !== 'Unauthorized or Forbidden') {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    }
}

// NEW: Handle Confirm Delivery Function (for School, after QR scan)
async function handleConfirmDelivery(wasteId) {
    console.log(`Frontend sending confirm delivery request for ID: ${wasteId}`);
    try {
        // TODO: Update to your Render.com Backend URL
        const response = await authenticatedFetch(`https://phuket-food-hero-api.onrender.com/api/waste/confirm-delivery/${wasteId}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('ยืนยันการส่งมอบเศษอาหารสำเร็จ!');
            loadPendingDeliveryPage(); // Reload pending delivery list
        } else {
            const errorData = await response.json();
            alert('ยืนยันการส่งมอบไม่สำเร็จ: ' + (errorData.msg || 'เกิดข้อผิดพลาด'));
        }
    } catch (error) {
        console.error('Confirm Delivery Error:', error);
        if (error.message !== 'Unauthorized or Forbidden') {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    }
}

// --- Main Page Loading Function ---
function loadContent(contentHtml) {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = contentHtml;
    console.log("loadContent called. HTML loaded into app-container."); // Log for debugging

    // --- Common Event Listeners ---
    // These listeners are attached every time contentHtml is loaded,
    // ensuring they always work for newly rendered elements.
    if (document.getElementById('backToMain')) {
        document.getElementById('backToMain').addEventListener('click', loadMainPage);
    }
    if (document.getElementById('backToMainFromDashboard')) {
        document.getElementById('backToMainFromDashboard').addEventListener('click', loadMainPage);
    }
    if (document.getElementById('backFromAddWasteData')) {
        document.getElementById('backFromAddWasteData').addEventListener('click', loadSchoolDashboard);
    }
    if (document.getElementById('backFromPostDetails')) {
        document.getElementById('backFromPostDetails').addEventListener('click', loadFarmerDashboard);
    }
    if (document.getElementById('backFromGenericLogin')) {
        document.getElementById('backFromGenericLogin').addEventListener('click', loadMainPage);
    }
    if (document.getElementById('backFromAnalysis')) {
        document.getElementById('backFromAnalysis').addEventListener('click', loadSchoolDashboard);
    }
    if (document.getElementById('backFromEditProfile')) {
        document.getElementById('backFromEditProfile').addEventListener('click', loadSchoolDashboard);
    }
    if (document.getElementById('backFromKnowledge')) {
        document.getElementById('backFromKnowledge').addEventListener('click', (event) => {
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'school') {
                loadSchoolDashboard();
            } else if (userRole === 'farmer') {
                loadFarmerDashboard();
            } else {
                loadMainPage(); // Fallback
            }
        });
    }
    if (document.getElementById('backFromReceivedWaste')) {
        document.getElementById('backFromReceivedWaste').addEventListener('click', loadFarmerDashboard);
    }
    if (document.getElementById('backFromPendingDelivery')) {
        document.getElementById('backFromPendingDelivery').addEventListener('click', loadSchoolDashboard);
    }
    if (document.getElementById('backFromQRScan')) {
        document.getElementById('backFromQRScan').addEventListener('click', loadPendingDeliveryPage);
    }


    // --- Page Specific Event Listeners (attached after content is loaded) ---
    // These are for forms/buttons that are present only on specific pages.
    if (document.getElementById('purposeSelect')) {
        document.getElementById('purposeSelect').addEventListener('change', toggleOtherPurposeInput);
    }
    if (document.getElementById('editPurposeSelect')) { // For edit profile page
        document.getElementById('editPurposeSelect').addEventListener('change', toggleEditOtherPurposeInput);
    }

    if (document.getElementById('schoolButton')) {
        document.getElementById('schoolButton').addEventListener('click', () => loadContent(getSchoolLoginPageHtml()));
    }
    if (document.getElementById('farmerButton')) {
        document.getElementById('farmerButton').addEventListener('click', () => loadContent(getFarmerLoginPageHtml()));
    }

    // --- Form Submissions ---
    const schoolLoginForm = document.getElementById('schoolLoginForm');
    if (schoolLoginForm) {
        schoolLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(schoolLoginForm);
            const email = formData.get('email');
            const password = formData.get('password');
            const additionalData = {
                instituteName: formData.get('instituteName'),
                address: formData.get('address'),
                contactNumber: formData.get('contactNumber')
            };
            await handleAuthSubmission(email, password, 'school', additionalData);
        });
    }

    const farmerLoginForm = document.getElementById('farmerLoginForm');
    if (farmerLoginForm) {
        farmerLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(farmerLoginForm);
            const email = formData.get('email');
            const password = formData.get('password');
            const purpose = formData.get('purpose');
            const otherPurpose = formData.get('otherPurpose');

            if (purpose === 'other' && !otherPurpose.trim()) {
                alert('กรุณาระบุความต้องการอื่นๆ');
                return;
            }

            const additionalData = {
                name: formData.get('name'),
                contactNumber: formData.get('contactNumber'),
                purpose: purpose,
                otherPurpose: purpose === 'other' ? otherPurpose : undefined
            };
            await handleAuthSubmission(email, password, 'farmer', additionalData);
        });
    }

    const genericLoginForm = document.getElementById('genericLoginForm');
    if (genericLoginForm) {
        genericLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(genericLoginForm);
            const email = formData.get('email');
            const password = formData.get('password');
            await genericLoginAttempt(email, password);
        });
    }

    const addWasteForm = document.getElementById('addWasteForm');
    if (addWasteForm) {
        addWasteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addWasteForm);

            try {
                // TODO: Update to your Render.com Backend URL
                const response = await authenticatedFetch('https://phuket-food-hero-api.onrender.com/api/waste/add', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    alert('บันทึกข้อมูลเศษอาหารสำเร็จ!');
                    loadSchoolDashboard();
                } else {
                    const errorData = await response.json();
                    alert('บันทึกข้อมูลไม่สำเร็จ: ' + (errorData.msg || 'เกิดข้อผิดพลาด'));
                }
            } catch (error) {
                console.error('Add Waste Error:', error);
                if (error.message !== 'Unauthorized or Forbidden') {
                    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
                }
            }
        });

        // Image preview logic
        const wasteImageInput = document.getElementById('wasteImage');
        const imagePreview = document.getElementById('imagePreview');
        if (wasteImageInput && imagePreview) {
            wasteImageInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        imagePreview.src = e.target.result;
                        imagePreview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else {
                    imagePreview.src = '';
                    imagePreview.style.display = 'none';
                }
            });
        }
    }

    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            alert('คุณกดบันทึกข้อมูลแก้ไขแล้ว! (ยังไม่ส่งข้อมูลไปยัง Backend)');
            // TODO: Phase 2 - Implement Backend API to update user profile
            // Example:
            // const formData = new FormData(editProfileForm);
            // const data = Object.fromEntries(formData.entries());
            // const response = await authenticatedFetch('https://phuket-food-hero-api.onrender.com/api/auth/profile', {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(data)
            // });
            loadSchoolDashboard(); // Go back to dashboard
        });
    }


    // --- Dashboard specific buttons (always available on dashboards) ---
    if (document.getElementById('addWasteDataButton')) {
        document.getElementById('addWasteDataButton').addEventListener('click', () => {
            loadContent(getAddWasteDataHtml());
        });
    }
    if (document.getElementById('viewAnalysisButton')) {
        document.getElementById('viewAnalysisButton').addEventListener('click', loadAnalysisPage);
    }
    if (document.getElementById('editProfileButton')) {
        document.getElementById('editProfileButton').addEventListener('click', loadEditProfilePage);
    }
    if (document.getElementById('knowledgeButton')) {
        document.getElementById('knowledgeButton').addEventListener('click', loadKnowledgePage);
    }
    if (document.getElementById('pendingDeliveryButton')) {
        document.getElementById('pendingDeliveryButton').addEventListener('click', loadPendingDeliveryPage);
    }
    if (document.getElementById('receivedWasteButton')) {
        document.getElementById('receivedWasteButton').addEventListener('click', loadReceivedWastePage);
    }

    // --- Farmer Dashboard Filter button (only on farmer dashboard) ---
    if (document.getElementById('filterSearchButton')) {
        document.getElementById('filterSearchButton').addEventListener('click', applyFarmerFilters);
    }

    // NEW: School Scan QR button (on pending delivery page)
    const scanQRButton = document.getElementById('scanQRButton');
    if (scanQRButton) {
        scanQRButton.addEventListener('click', async () => {
            const wasteId = prompt('จำลองการสแกน QR Code: กรุณากรอก ID ของเศษอาหารที่ต้องการยืนยันการส่งมอบ');
            if (wasteId) {
                await handleConfirmDelivery(wasteId);
            } else {
                alert('กรุณากรอก ID เศษอาหาร');
            }
        });
    }
}

// --- Page HTML Content Functions ---
function getMainPageHtml() {
    return `
        <div class="main-page-container">
            <h2 class="main-question-text">คุณคือใครในโครงการ PHUKET FOOD HERO นี้</h2>
            <div class="cards-and-descriptions-wrapper">
                <div class="card-with-description">
                    <div class="card">
                        <!-- *** คุณต้องเปลี่ยน Path รูปภาพโรงเรียนตรงนี้! *** -->
                        <img src="images/school_image.jpg" alt="รูปภาพโรงเรียน" class="card-image">
                        <button class="button" id="schoolButton">โรงเรียน</button>
                    </div>
                    <p class="card-description-text">คลิกที่นี่เพื่อลงทะเบียนและจัดการเศษอาหารเหลือจากโรงเรียนของคุณ</p>
                </div>
                <div class="card-with-description">
                    <div class="card">
                        <!-- *** คุณต้องเปลี่ยน Path รูปภาพเกษตรกรตรงนี้! *** -->
                        <img src="images/farmer_image.jpg" alt="รูปภาพเกษตรกร" class="card-image">
                        <button class="button" id="farmerButton">เกษตรกร</button>
                    </div>
                    <p class="card-description-text">คลิกที่นี่เพื่อเลือกประเภทเศษอาหารที่คุณต้องการนำไปใช้ประโยชน์</p>
                </div>
            </div>
        </div>
    `;
}

// Generic Login Page HTML
function getGenericLoginPageHtml() {
    return `
        <div class="login-container">
            <h2>เข้าสู่ระบบ</h2>
            <form id="genericLoginForm">
                <div class="form-group">
                    <label for="genericEmail">อีเมล</label>
                    <input type="email" id="genericEmail" name="email" required>
                </div>
                <div class="form-group">
                    <label for="genericPassword">รหัสผ่าน</label>
                    <input type="password" id="genericPassword" name="password" required>
                </div>
                <button type="submit" class="login-button">เข้าสู่ระบบ</button>
                <button type="button" class="back-button" id="backFromGenericLogin">ย้อนกลับ</button>
            </form>
            <p style="margin-top: 20px; color: #555; font-size: 0.9em;">
                หากยังไม่มีบัญชี กรุณาเลือกบทบาทของคุณบนหน้าหลักเพื่อลงทะเบียน
            </p>
        </div>
    `;
}

function getSchoolLoginPageHtml() {
    return `
        <div class="login-container">
            <h2>Login สำหรับโรงเรียน</h2>
            <form id="schoolLoginForm">
                <div class="form-group">
                    <label for="instituteName">ชื่อสถาบัน</label>
                    <input type="text" id="instituteName" name="instituteName" required>
                </div>
                <div class="form-group">
                    <label for="address">ที่อยู่</label>
                    <input type="text" id="address" name="address" required>
                </div>
                <div class="form-group">
                    <label for="contactNumber">เบอร์ติดต่อ</label>
                    <input type="tel" id="contactNumber" name="contactNumber" required>
                </div>
                <div class="form-group">
                    <label for="schoolEmail">อีเมล</label>
                    <input type="email" id="schoolEmail" name="email" required>
                </div>
                <div class="form-group">
                    <label for="schoolPassword">รหัสผ่าน</label>
                    <input type="password" id="schoolPassword" name="password" required>
                </div>
                <button type="submit" class="login-button">Login</button>
                <button type="button" class="back-button" id="backToMain">ย้อนกลับ</button>
            </form>
        </div>
    `;
}

function getFarmerLoginPageHtml() {
    return `
        <div class="login-container">
            <h2>Login เกษตรกร</h2>
            <form id="farmerLoginForm">
                <div class="form-group">
                    <label for="farmerName">ชื่อ</label>
                    <input type="text" id="farmerName" name="name" required>
                </div>
                <div class="form-group">
                    <label for="farmerContactNumber">เบอร์ติดต่อ</label>
                    <input type="tel" id="farmerContactNumber" name="contactNumber" required>
                </div>
                <div class="form-group">
                    <label for="farmerEmail">อีเมล</label>
                    <input type="email" id="farmerEmail" name="email" required>
                </div>
                <div class="form-group">
                    <label for="farmerPassword">รหัสผ่าน</label>
                    <input type="password" id="farmerPassword" name="password" required>
                </div>
                <div class="form-group">
                    <label for="purposeSelect">ความต้องการของคุณ</label>
                    <select id="purposeSelect" name="purpose" required>
                        <option value="">-- เลือกความต้องการ --</option>
                        <option value="animal_feed">อยากนำเศษอาหารไปเลี้ยงสัตว์</option>
                        <option value="compost">อยากนำเศษอาหารไปหมักทำปุ๋ย</option>
                        <option value="other">อื่นๆ</option>
                    </select>
                </div>
                <div class="form-group" id="otherPurposeInput">
                    <label for="otherPurpose">ระบุความต้องการอื่นๆ</label>
                    <textarea id="otherPurpose" name="otherPurpose" rows="3"></textarea>
                </div>
                <button type="submit" class="login-button">Login</button>
                <button type="button" class="back-button" id="backToMain">ย้อนกลับ</button>
            </form>
        </div>
    `;
}

// School Dashboard Page HTML content - now dynamically loads data
function getSchoolDashboardHtml() {
    return `
        <div class="school-dashboard-container">
            <div class="dashboard-content-area">
                <div class="sidebar">
                    <p class="user-stars">⭐ 0 ดาว</p>
                    <p style="color: #666; font-size:0.9em; text-align: center; padding: 10px;">(ฟังก์ชันกรองจะอยู่บนหน้าของเกษตรกร)</p>
                </div>
                <div class="main-display-area">
                    <div class="data-block-wrapper" id="schoolDataBlocks">
                        <p style="text-align: center; color: #555;">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            </div>

            <div class="dashboard-buttons">
                <button type="button" class="back-button" id="backToMainFromDashboard">ย้อนกลับ</button>
                <button type="button" class="add-data-button" id="addWasteDataButton">เพิ่มข้อมูลเศษอาหาร</button>
                <button type="button" class="analysis-button" id="viewAnalysisButton">ดูรายงานวิเคราะห์</button>
                <button type="button" class="edit-profile-button" id="editProfileButton">แก้ไขข้อมูล</button>
                <button type="button" class="knowledge-button" id="knowledgeButton">ความรู้เรื่องการกำจัดขยะ</button>
                <button type="button" class="pending-delivery-button" id="pendingDeliveryButton">รายการเศษอาหารที่ต้องส่ง</button>
            </div>
        </div>
    `;
}

// Add Waste Data Page HTML content
function getAddWasteDataHtml() {
    return `
        <div class="add-waste-container">
            <h2>เพิ่มข้อมูลเศษอาหาร</h2>
            <form id="addWasteForm">
                <div class="form-row">
                    <div class="form-group upload-group">
                        <label for="wasteImage" class="upload-button-label">อัพโหลดรูปภาพเศษอาหาร</label>
                        <input type="file" id="wasteImage" name="wasteImage" accept="image/*" class="hidden-input">
                        <img id="imagePreview" src="#" alt="Image Preview" style="display:none;">
                    </div>
                    <div class="form-fields-group">
                        <div class="form-group">
                            <label for="menu">เมนู</label>
                            <input type="text" id="menu" name="menu" placeholder="เช่น ข้าวผัด" required>
                        </div>
                        <div class="form-group">
                            <label for="weight">น้ำหนัก</label>
                            <input type="number" id="weight" name="weight" step="0.1" placeholder="เช่น 5.0 (kg)" required>
                        </div>
                        <div class="form-group">
                            <label for="date">วันที่</label>
                            <input type="date" id="date" name="date" required>
                        </div>
                    </div>
                </div>
                <div class="form-buttons">
                    <button type="button" class="back-button" id="backFromAddWasteData">ย้อนกลับ</button>
                    <button type="submit" class="login-button">ยืนยัน</button>
                </div>
            </form>
        </div>
    `;
}

// Farmer Dashboard Page HTML content - now dynamically loads data and includes filters
function getFarmerDashboardHtml() {
    return `
        <div class="farmer-dashboard-container">
            <div class="dashboard-content-area">
                <div class="sidebar">
                    <p class="user-stars">⭐ 0 ดาว</p>
                    <h3>กรอง</h3>
                    <div class="filter-group">
                        <label for="filterWeightMin">น้ำหนัก (kg):</label>
                        <div class="filter-weight-inputs">
                            <input type="number" id="filterWeightMin" placeholder="ขั้นต่ำ" step="0.1">
                            <span>-</span>
                            <input type="number" id="filterWeightMax" placeholder="สูงสุด" step="0.1">
                        </div>
                    </div>
                    <div class="filter-group">
                        <label for="filterMenu">เมนู:</label>
                        <input type="text" id="filterMenu" placeholder="เช่น ข้าวผัด">
                    </div>
                    <div class="filter-group">
                        <label for="filterDate">วันที่:</label>
                        <input type="date" id="filterDate">
                    </div>
                    <div class="filter-group">
                        <label for="filterSchoolName">ชื่อโรงเรียน:</label>
                        <input type="text" id="filterSchoolName" placeholder="เช่น โรงเรียน ABC">
                    </div>
                    <button type="button" class="filter-button" id="filterSearchButton">ค้นหา</button>
                </div>
                <div class="main-display-area">
                    <div class="data-block-wrapper" id="farmerDataBlocks">
                        <p style="text-align: center; color: #555;">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            </div>

            <div class="dashboard-buttons">
                <button type="button" class="back-button" id="backToMainFromDashboard">ย้อนกลับ</button>
                <button type="button" class="knowledge-button" id="knowledgeButton">ความรู้เรื่องการกำจัดขยะ</button>
                <button type="button" class="received-waste-button-list" id="receivedWasteButton">รายการเศษอาหารที่รับแล้ว</button>
            </div>
        </div>
    `;
}

// Post Details Page HTML content - dynamically populates data
function getPostDetailsHtml(postData) {
    if (!postData) {
        return `<div class="post-details-container"><p style="color: #666; text-align: center;">ไม่พบข้อมูลรายละเอียด</p><div class="form-buttons"><button type="button" class="back-button" id="backFromPostDetails">ย้อนกลับ</button></div></div>`;
    }

    const date = new Date(postData.date).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return `
        <div class="post-details-container">
            <h2>รายละเอียดเศษอาหาร</h2>
            <div class="details-content">
                <img src="${postData.imageUrl || 'https://placehold.co/300x250/ADD8E6/000000?text=No+Image'}" alt="Waste Image" class="details-image">
                <div class="details-fields-group">
                    <p><strong>เมนู:</strong> ${postData.menu}</p>
                    <p><strong>น้ำหนัก:</strong> ${postData.weight} kg</p>
                    <p><strong>วันที่:</strong> ${date}</p>
                    <p><strong>โรงเรียน:</strong> ${postData.school ? postData.school.instituteName : 'ไม่ระบุโรงเรียน'}</p>
                    <p><strong>อีเมล:</strong> ${postData.school ? postData.school.email : 'ไม่ระบุ'}</p>
                    <p><strong>ที่อยู่:</strong> ${postData.school ? postData.school.address : 'ไม่ระบุ'}</p>
                    <p><strong>เบอร์ติดต่อ:</strong> ${postData.school ? postData.school.contactNumber : 'ไม่ระบุ'}</p>
                </div>
            </div>
            <div class="form-buttons">
                <button type="button" class="back-button" id="backFromPostDetails">ย้อนกลับ</button>
            </div>
        </div>
    `;
}

// Analysis Page HTML content
function getAnalysisPageHtml() {
    return `
        <div class="analysis-container">
            <h2>รายงานวิเคราะห์เศษอาหาร (7 วันล่าสุด)</h2>
            <div class="chart-container">
                <canvas id="wasteChart"></canvas>
            </div>
            <div class="form-buttons">
                <button type="button" class="back-button" id="backFromAnalysis">ย้อนกลับ</button>
            </div>
        </div>
    `;
}

// Edit Profile Page HTML content
function getEditProfilePageHtml(userData = {}) {
    const userRole = localStorage.getItem('userRole');
    const instituteName = userData.instituteName || '';
    const address = userData.address || '';
    const contactNumber = userData.contactNumber || '';
    const email = userData.email || '';
    const name = userData.name || '';
    const purpose = userData.purpose || '';
    const otherPurpose = userData.otherPurpose || '';

    let roleSpecificFields = '';
    if (userRole === 'school') {
        roleSpecificFields = `
            <div class="form-group">
                <label for="editInstituteName">ชื่อสถาบัน</label>
                <input type="text" id="editInstituteName" name="instituteName" value="${instituteName}" required>
            </div>
            <div class="form-group">
                <label for="editAddress">ที่อยู่</label>
                <input type="text" id="editAddress" name="address" value="${address}" required>
            </div>
            <div class="form-group">
                <label for="editContactNumber">เบอร์ติดต่อ</label>
                <input type="tel" id="editContactNumber" name="contactNumber" value="${contactNumber}" required>
            </div>
        `;
    } else if (userRole === 'farmer') {
         roleSpecificFields = `
            <div class="form-group">
                <label for="editFarmerName">ชื่อ</label>
                <input type="text" id="editFarmerName" name="name" value="${name}" required>
            </div>
            <div class="form-group">
                <label for="editContactNumber">เบอร์ติดต่อ</label>
                <input type="tel" id="editContactNumber" name="contactNumber" value="${contactNumber}" required>
            </div>
            <div class="form-group">
                <label for="editPurposeSelect">ความต้องการของคุณ</label>
                <select id="editPurposeSelect" name="purpose" required>
                    <option value="animal_feed" ${purpose === 'animal_feed' ? 'selected' : ''}>อยากนำเศษอาหารไปเลี้ยงสัตว์</option>
                    <option value="compost" ${purpose === 'compost' ? 'selected' : ''}>อยากนำเศษอาหารไปหมักทำปุ๋ย</option>
                    <option value="other" ${purpose === 'other' ? 'selected' : ''}>อื่นๆ</option>
                </select>
            </div>
            <div class="form-group" id="editOtherPurposeInput" style="${purpose === 'other' ? 'display:block;' : 'display:none;'}">
                <label for="editOtherPurpose">ระบุความต้องการอื่นๆ</label>
                <textarea id="editOtherPurpose" name="otherPurpose" rows="3">${otherPurpose}</textarea>
            </div>
        `;
    }

    return `
        <div class="edit-profile-container">
            <h2>แก้ไขข้อมูลส่วนตัว</h2>
            <form id="editProfileForm">
                ${roleSpecificFields}
                <div class="form-group">
                    <label for="editEmail">อีเมล (ไม่สามารถแก้ไขได้)</label>
                    <input type="email" id="editEmail" name="email" value="${email}" disabled>
                </div>
                <div class="form-group">
                    <label for="editPassword">รหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)</label>
                    <input type="password" id="editPassword" name="password">
                </div>
                <div class="form-buttons">
                    <button type="button" class="back-button" id="backFromEditProfile">ย้อนกลับ</button>
                    <button type="submit" class="login-button">บันทึกข้อมูล</button>
                </div>
            </form>
        </div>
    `;
}

// Knowledge Page HTML content
function getKnowledgePageHtml() {
    return `
        <div class="knowledge-container">
            <h2>ความรู้เรื่องการกำจัดขยะและเศษอาหาร</h2>
            <div class="knowledge-content">
                <h3>ทำไมต้องแยกขยะเศษอาหาร?</h3>
                <p>การแยกขยะเศษอาหารออกจากขยะประเภทอื่น ๆ มีความสำคัญอย่างยิ่งในการช่วยลดผลกระทบต่อสิ่งแวดล้อม และเพิ่มมูลค่าให้กับเศษอาหารเหล่านั้น:</p>
                <ul>
                    <li><strong>ลดมลพิษในหลุมฝังกลบ:</strong> เศษอาหารที่เน่าเปื่อยในหลุมฝังกลบจะปล่อยก๊าซมีเทน ซึ่งเป็นก๊าซเรือนกระจกที่รุนแรงกว่าคาร์บอนไดออกไซด์ถึง 25 เท่า การแยกเศษอาหารช่วยลดการปล่อยก๊าซเหล่านี้</li>
                    <li><strong>ลดกลิ่นและแมลง:</strong> การแยกเศษอาหารช่วยลดกลิ่นเหม็นและปัญหาแมลงวัน สัตว์พาหะต่าง ๆ ที่มักจะมาตอมกองขยะรวม</li>
                    <li><strong>สร้างมูลค่า:</strong> เศษอาหารสามารถนำไปแปรรูปเป็นปุ๋ยหมักคุณภาพสูงสำหรับพืช หรือใช้เป็นอาหารสัตว์ ซึ่งเป็นการหมุนเวียนทรัพยากรกลับคืนสู่ระบบเศรษฐกิจ</li>
                    <li><strong>ลดค่าใช้จ่ายในการกำจัด:</strong> การลดปริมาณขยะเศษอาหารที่ต้องนำไปฝังกลบ ช่วยลดภาระและค่าใช้จ่ายในการจัดการขยะของเทศบาล</li>
                </ul>

                <h3>วิธีการจัดการเศษอาหารเบื้องต้น</h3>
                <ol>
                    <li><strong>แยกตั้งแต่ต้นทาง:</strong> แบ่งถังขยะสำหรับเศษอาหารโดยเฉพาะในครัวเรือนหรือโรงเรียน</li>
                    <li><strong>เทน้ำออก:</strong> ก่อนทิ้งเศษอาหาร ควรเทน้ำหรือของเหลวส่วนเกินออกให้มากที่สุด เพื่อลดน้ำหนักและกลิ่น</li>
                    <li><strong>ใส่ภาชนะที่เหมาะสม:</strong> ใช้ถุงหรือภาชนะที่ปิดสนิทเพื่อป้องกันกลิ่นและสัตว์รบกวน</li>
                    <li><strong>นำไปใช้ประโยชน์:</strong> หากเป็นไปได้ ลองนำเศษอาหารไปทำปุ๋ยหมักเองที่บ้าน หรือหาแหล่งรับซื้อ/รับบริจาคเศษอาหารในชุมชน</li>
                </ol>

                <h3>แหล่งข้อมูลเพิ่มเติม:</h3>
                <ul>
                    <li><a href="https://www.youtube.com/watch?v=your_knowledge_video_link" target="_blank">วิดีโอเกี่ยวกับการแยกเศษอาหาร</a></li>
                    <li><a href="https://www.example.com/foodwaste_article" target="_blank">บทความเกี่ยวกับการลดขยะอาหาร</a></li>
                </ul>
            </div>
            <div class="form-buttons">
                <button type="button" class="back-button" id="backFromKnowledge">ย้อนกลับ</button>
            </div>
        </div>
    `;
}

// NEW: Pending Delivery Page HTML content (for School)
function getPendingDeliveryHtml(pendingItems = []) {
    let pendingBlocksHtml = '';
    if (pendingItems.length === 0) {
        pendingBlocksHtml = '<p style="color: #666; text-align: center; margin-top: 30px;">ไม่มีรายการเศษอาหารที่ต้องส่ง</p>';
    } else {
        pendingItems.forEach(item => {
            const date = new Date(item.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            const receivedAt = new Date(item.receivedAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' });
            pendingBlocksHtml += `
                <div class="data-block pending-item">
                    <img src="${item.imageUrl || 'https://placehold.co/100x80/ADD8E6/000000?text=Waste+Pic'}" alt="Waste Image" class="data-item-image">
                    <div class="data-item-details">
                        <p><strong>เมนู:</strong> ${item.menu}</p>
                        <p><strong>ปริมาณ:</strong> ${item.weight} kg</p>
                        <p><strong>วันที่โพสต์:</strong> ${date}</p>
                        <p><strong>ผู้รับ (เกษตรกร):</strong> ${item.receivedBy ? item.receivedBy.name : 'ไม่ระบุ'}</p>
                        <p><strong>ติดต่อผู้รับ:</strong> ${item.receivedBy ? item.receivedBy.contactNumber : 'ไม่ระบุ'}</p>
                        <p><strong>รับแล้วเมื่อ:</strong> ${receivedAt}</p>
                    </div>
                    <button class="scan-qr-button" data-id="${item._id}">สแกน QR Code เพื่อยืนยัน</button>
                </div>
            `;
        });
    }

    return `
        <div class="pending-delivery-container">
            <h2>รายการเศษอาหารที่ต้องส่ง</h2>
            <div class="pending-list-area">
                <div class="data-block-wrapper" id="pendingDeliveryBlocks">
                    ${pendingBlocksHtml}
                </div>
            </div>
            <div class="form-buttons">
                <button type="button" class="back-button" id="backFromPendingDelivery">ย้อนกลับ</button>
            </div>
        </div>
    `;
}

// NEW: Received Waste HTML (for Farmer)
function getReceivedWasteHtml(receivedItems = []) {
    let receivedBlocksHtml = '';
    if (receivedItems.length === 0) {
        receivedBlocksHtml = '<p style="color: #666; text-align: center; margin-top: 30px;">ยังไม่มีรายการเศษอาหารที่รับ</p>';
    } else {
        receivedItems.forEach(item => {
            const date = new Date(item.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            const receivedAt = new Date(item.receivedAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' });
            const deliveredStatus = item.isDelivered ? 'ส่งมอบแล้ว' : 'รอส่งมอบ';
            receivedBlocksHtml += `
                <div class="data-block received-item">
                    <img src="${item.imageUrl || 'https://placehold.co/100x80/ADD8E6/000000?text=Waste+Pic'}" alt="Waste Image" class="data-item-image">
                    <div class="data-item-details">
                        <p><strong>เมนู:</strong> ${item.menu}</p>
                        <p><strong>ปริมาณ:</strong> ${item.weight} kg</p>
                        <p><strong>วันที่โพสต์:</strong> ${date}</p>
                        <p><strong>จากโรงเรียน:</strong> ${item.school ? item.school.instituteName : 'ไม่ระบุโรงเรียน'}</p>
                        <p><strong>รับแล้วเมื่อ:</strong> ${receivedAt}</p>
                        <p><strong>สถานะส่งมอบ:</strong> <span class="${item.isDelivered ? 'status-delivered' : 'status-pending'}">${deliveredStatus}</span></p>
                    </div>
                    ${!item.isDelivered ? `
                        <button class="show-qr-button" data-id="${item._id}">แสดง QR Code</button>
                    ` : ''}
                </div>
            `;
        });
    }
    return `
        <div class="received-waste-container">
            <h2>รายการเศษอาหารที่รับแล้ว</h2>
            <div class="received-list-area">
                <div class="data-block-wrapper" id="receivedWasteBlocks">
                    ${receivedBlocksHtml}
                </div>
            </div>
            <div class="form-buttons">
                <button type="button" class="back-button" id="backFromReceivedWaste">ย้อนกลับ</button>
            </div>
        </div>
    `;
}

// NEW: QR Code Display Page HTML
function getQRCodeDisplayHtml(wasteId) {
    // In a real app, you'd use a QR code library to render a canvas or SVG QR.
    // For this example, we display the ID as text, simulating the QR content.
    return `
        <div class="qr-code-container">
            <h2>แสดง QR Code</h2>
            <p>กรุณาให้โรงเรียนสแกน QR Code นี้เพื่อยืนยันการรับเศษอาหาร</p>
            <div class="qr-code-box">
                <p class="qr-code-text">Waste ID: ${wasteId}</p>
                <!-- In a real app, a QR code image/canvas would go here -->
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wasteId}" alt="QR Code for Waste ID">
            </div>
            <div class="form-buttons">
                <button type="button" class="back-button" id="backFromQRScan">ย้อนกลับ</button>
            </div>
        </div>
    `;
}


// --- Dashboard Loading Functions (fetch data) ---
async function loadSchoolDashboard() {
    loadContent(getSchoolDashboardHtml());
    try {
        // TODO: Update to your Render.com Backend URL
        const response = await authenticatedFetch('https://phuket-food-hero-api.onrender.com/api/waste/posts');
        const data = await response.json();
        console.log("Data for school dashboard:", data); // Log data
        renderDataBlocks(data, '#schoolDataBlocks');
    }
    catch (error) {
        console.error('Failed to load school dashboard data:', error);
        document.querySelector('#schoolDataBlocks').innerHTML = '<p style="color: red; text-align: center;">ไม่สามารถโหลดข้อมูลได้</p>';
    }
}

async function loadFarmerDashboard(filters = {}) {
    loadContent(getFarmerDashboardHtml());
    try {
        // TODO: Update to your Render.com Backend URL
        let url = new URL('https://phuket-food-hero-api.onrender.com/api/waste/filter');
        Object.keys(filters).forEach(key => {
            if (filters[key]) url.searchParams.append(key, filters[key]);
        });

        const response = await authenticatedFetch(url.toString());
        const data = await response.json();
        console.log("Data for farmer dashboard:", data); // Log data
        renderDataBlocks(data, '#farmerDataBlocks');

        // Restore filter values if filters were applied
        if (filters.weightMin) document.getElementById('filterWeightMin').value = filters.weightMin;
        if (filters.weightMax) document.getElementById('filterWeightMax').value = filters.weightMax;
        if (filters.menu) document.getElementById('filterMenu').value = filters.menu;
        if (filters.date) document.getElementById('filterDate').value = filters.date;
        if (filters.schoolName) document.getElementById('filterSchoolName').value = filters.schoolName;

    } catch (error) {
        console.error('Failed to load farmer dashboard data:', error);
        document.querySelector('#farmerDataBlocks').innerHTML = '<p style="color: red; text-align: center;">ไม่สามารถโหลดข้อมูลได้</p>';
    }
}

async function applyFarmerFilters() {
    const filters = {
        weightMin: document.getElementById('filterWeightMin').value,
        weightMax: document.getElementById('filterWeightMax').value,
        menu: document.getElementById('filterMenu').value,
        date: document.getElementById('filterDate').value,
        schoolName: document.getElementById('filterSchoolName').value
    };
    await loadFarmerDashboard(filters);
}

async function loadPostDetails(postId) {
    try {
        // TODO: Update to your Render.com Backend URL
        const response = await authenticatedFetch(`https://phuket-food-hero-api.onrender.com/api/waste/posts/${postId}`);
        const postData = await response.json();
        loadContent(getPostDetailsHtml(postData));
    } catch (error) {
        console.error('Failed to load post details:', error);
        loadContent(getPostDetailsHtml(null));
    }
}

async function loadAnalysisPage() {
    loadContent(getAnalysisPageHtml());
    try {
        // TODO: Update to your Render.com Backend URL
        const response = await authenticatedFetch('https://phuket-food-hero-api.onrender.com/api/waste/analyze');
        const { analysis, rawData } = await response.json(); // Get both analysis and rawData

        if (analysis.length === 0) {
            document.getElementById('wasteChart').style.display = 'none';
            document.querySelector('.chart-container').innerHTML = '<p style="color: #666; text-align: center; margin-top: 30px;">ไม่พบข้อมูลสำหรับวิเคราะห์</p>';
            return;
        }

        const ctx = document.getElementById('wasteChart').getContext('2d');
        
        // Prepare data for Chart.js
        const labels = analysis.map(item => item.menu);
        const data = analysis.map(item => item.totalWeight);

        new Chart(ctx, {
            type: 'bar', // Bar chart for total waste per menu
            data: {
                labels: labels,
                datasets: [{
                    label: 'ปริมาณเศษอาหาร (kg)',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allow chart to adjust size
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'ปริมาณ (kg)',
                            color: '#333'
                        },
                        ticks: {
                            color: '#333'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'เมนูอาหาร',
                            color: '#333'
                        },
                        ticks: {
                            color: '#333'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false // No legend needed for single dataset
                    },
                    title: {
                        display: true,
                        text: 'เมนูที่เหลือมากที่สุดในสัปดาห์',
                        color: '#333',
                        font: {
                            size: 18
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Failed to load analysis data:', error);
        document.querySelector('.chart-container').innerHTML = '<p style="color: red; text-align: center;">ไม่สามารถโหลดข้อมูลวิเคราะห์ได้</p>';
    }
}

// Load Edit Profile Page Function (fetches user data)
async function loadEditProfilePage() {
    loadContent(getEditProfilePageHtml()); // Load empty form first
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
            loadMainPage();
            return;
        }
        // TODO: Update to your Render.com Backend URL
        const response = await authenticatedFetch(`https://phuket-food-hero-api.onrender.com/api/auth/profile/${userId}`); // Assuming API to get profile
        const userData = await response.json();
        
        // Populate form fields
        document.getElementById('editEmail').value = userData.email || '';
        if (document.getElementById('editInstituteName')) document.getElementById('editInstituteName').value = userData.instituteName || '';
        if (document.getElementById('editAddress')) document.getElementById('editAddress').value = userData.address || '';
        if (document.getElementById('editContactNumber')) document.getElementById('editContactNumber').value = userData.contactNumber || '';
        if (document.getElementById('editFarmerName')) document.getElementById('editFarmerName').value = userData.name || '';
        
        const purposeSelect = document.getElementById('editPurposeSelect');
        if (purposeSelect) {
            purposeSelect.value = userData.purpose || '';
            const editOtherPurposeInput = document.getElementById('editOtherPurposeInput');
            if (editOtherPurposeInput) {
                editOtherPurposeInput.style.display = (userData.purpose === 'other' ? 'block' : 'none');
                document.getElementById('editOtherPurpose').value = userData.otherPurpose || '';
            }
        }
        // Attach event listener for purposeSelect in edit profile page
        if (document.getElementById('editPurposeSelect')) {
            document.getElementById('editPurposeSelect').addEventListener('change', toggleEditOtherPurposeInput);
        }

    } catch (error) {
        console.error('Failed to load profile data:', error);
        alert('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    }
}

// Load Knowledge Page Function
function loadKnowledgePage() {
    loadContent(getKnowledgePageHtml());
}

// NEW: Load Pending Delivery Page Function (for School)
async function loadPendingDeliveryPage() {
    loadContent(getPendingDeliveryHtml()); // Load empty structure first
    try {
        // TODO: Update to your Render.com Backend URL
        const response = await authenticatedFetch('https://phuket-food-hero-api.onrender.com/api/waste/pending-delivery');
        const data = await response.json();
        // Render pending items
        const pendingDeliveryBlocksWrapper = document.querySelector('#pendingDeliveryBlocks');
        if (pendingDeliveryBlocksWrapper) {
            pendingDeliveryBlocksWrapper.innerHTML = ''; // Clear loading message
            if (data.length === 0) {
                pendingDeliveryBlocksWrapper.innerHTML = '<p style="color: #666; text-align: center; margin-top: 30px;">ไม่มีรายการเศษอาหารที่ต้องส่ง</p>';
            } else {
                data.forEach(item => {
                    const date = new Date(item.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
                    const receivedAt = new Date(item.receivedAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' });
                    const pendingItemHtml = `
                        <div class="data-block pending-item">
                            <img src="${item.imageUrl || 'https://placehold.co/100x80/ADD8E6/000000?text=Waste+Pic'}" alt="Waste Image" class="data-item-image">
                            <div class="data-item-details">
                                <p><strong>เมนู:</strong> ${item.menu}</p>
                                <p><strong>ปริมาณ:</strong> ${item.weight} kg</p>
                                <p><strong>วันที่โพสต์:</strong> ${date}</p>
                                <p><strong>ผู้รับ (เกษตรกร):</strong> ${item.receivedBy ? item.receivedBy.name : 'ไม่ระบุ'}</p>
                                <p><strong>ติดต่อผู้รับ: แก้ไข Path รูปภาพพื้นหลังใน .content-section */
    background-image: url('images/background_waste.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
}

/* Add overlay to make text and buttons stand out */
.content-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6); /* Increased opacity for better white text readability */
    z-index: 1;
}

/* Styles for the main page content layout */
.main-page-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 1000px; /* Limit overall width for better layout */
    z-index: 2; /* Ensure it's above the overlay */
}

.main-question-text {
    color: var(--light-text); /* White color */
    font-size: 1.8em; /* Adjust size as needed */
    font-weight: 700;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.5); /* Optional: add shadow for readability */
    margin-bottom: 40px; /* Space between question and cards */
    text-align: center; /* Ensure it's centered */
}

.cards-and-descriptions-wrapper {
    display: flex;
    justify-content: center;
    gap: 40px; /* Space between the two card-description groups */
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    width: 100%;
}

.card-with-description {
    display: flex;
    flex-direction: column;
    align-items: center; /* Center card and text horizontally */
    text-align: center; /* Center text within its own block */
    max-width: 450px; /* Max width for each card group */
}

.card {
    background-color: var(--header-bg); /* White background for the card itself */
    border-radius: 15px;
    box-shadow: var(--card-shadow);
    overflow: hidden;
    width: 100%; /* Take full width of its parent (.card-with-description) */
    padding-bottom: 20px; /* Padding inside the card for button */
    margin-bottom: 20px; /* Space between card and description text */
    display: flex;
    flex-direction: column;
    align-items: center;
}

.card-image {
    width: 100%;
    height: 280px;
    object-fit: cover;
    display: block;
    border-bottom: 5px solid var(--primary-blue);
}

.button {
    background-color: var(--primary-blue);
    color: var(--light-text);
    border: none;
    padding: 15px 30px;
    border-radius: 30px;
    font-size: 1.2em;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-top: 20px; /* Space between image and button */
}

.button:hover {
    background-color: #0056b3;
}

.card-description-text {
    color: var(--light-text); /* White color for description text */
    font-size: 0.95em; /* Adjust size as needed */
    line-height: 1.4;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.5); /* Optional: add shadow for readability */
    max-width: 80%; /* Limit width for better readability */
}


/* Styles for login pages */
.login-container {
    background-color: var(--header-bg);
    padding: 30px;
    border-radius: 15px;
    box-shadow: var(--card-shadow);
    width: 100%;
    max-width: 500px;
    text-align: center;
    z-index: 2;
}

.login-container h2 {
    color: var(--dark-text);
    margin-bottom: 25px;
    font-size: 2em;
    font-weight: 700;
}

.form-group {
    margin-bottom: 20px;
    text-align: left;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #555;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"],
.form-group input[type="tel"],
.form-group select {
    width: calc(100% - 20px); /* Adjust for padding */
    padding: 12px 10px;
    border: 1px solid var(--input-border);
    border-radius: 8px;
    font-size: 1em;
    box-sizing: border-box; /* Include padding in width */
    transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--input-focus-border);
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.2);
}

.form-group textarea {
    width: calc(100% - 20px);
    padding: 12px 10px;
    border: 1px solid var(--input-border);
    border-radius: 8px;
    font-size: 1em;
    box-sizing: border-box;
    min-height: 80px;
    resize: vertical;
    transition: border-color 0.3s ease;
}

.form-group textarea:focus {
    outline: none;
    border-color: var(--input-focus-border);
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.2);
}


.login-button {
    background-color: var(--primary-blue);
    color: var(--light-text);
    border: none;
    padding: 12px 25px;
    border-radius: 25px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
    width: 100%;
    margin-top: 15px;
}

.login-button:hover {
    background-color: #0056b3;
}

.back-button {
    background-color: #6c757d; /* Grey color for back button */
    color: var(--light-text);
    border: none;
    padding: 10px 20px;
    border-radius: 25px;
    font-size: 1em;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-top: 10px;
    width: 100%;
}

.back-button:hover {
    background-color: #5a6268;
}

/* Hide other input for dropdown */
#otherPurposeInput {
    display: none;
    margin-top: 10px;
}

/* Styles for School Dashboard */
.school-dashboard-container {
    display: flex;
    flex-direction: column; /* Stack content area and buttons vertically */
    width: 100%;
    max-width: 1200px; /* Adjust max width for dashboard */
    height: 80vh; /* ให้มีความสูงเพื่อให้เห็น scroll ได้ถ้าข้อมูลเยอะ */
    background-color: transparent; /* พื้นหลังโปร่งใสเพราะมี overlay อยู่แล้ว */
    z-index: 2; /* ให้อยู่เหนือ background overlay */
    padding: 20px;
    box-sizing: border-box; /* Include padding in width/height */
}

.dashboard-content-area {
    display: flex;
    flex-grow: 1; /* Allow content area to take available space */
    background-color: var(--header-bg); /* White background for the main content area */
    border-radius: 15px;
    box-shadow: var(--card-shadow);
    overflow: hidden; /* Hide scrollbars if content overflows */
    margin-bottom: 20px; /* Space between content and buttons */
}

.sidebar {
    width: 250px; /* Fixed width for sidebar */
    background-color: var(--sidebar-bg); /* Dark background */
    color: var(--light-text);
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-top-left-radius: 15px;
    border-bottom-left-radius: 15px;
}

.main-display-area {
    flex-grow: 1; /* Take remaining space */
    padding: 20px;
    overflow-y: auto; /* Enable vertical scrolling if content overflows */
}

.data-block-wrapper {
    display: flex; /* Changed from grid to flex */
    flex-direction: column; /* Stack items vertically */
    gap: 20px; /* Space between data blocks */
}

.data-block {
    background-color: var(--data-block-bg); /* Light blue background */
    border-radius: 10px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    width: 100%; /* Ensure it takes full width in the column layout */
    position: relative; /* For positioning details/delete button */
}

.data-item-image {
    width: 100px;
    height: 80px;
    object-fit: cover;
    border-radius: 5px;
}

.data-item-details {
    flex-grow: 1; /* Allow details to take up space */
}

.data-item-details p {
    margin: 3px 0;
    font-size: 0.9em;
    color: var(--dark-text);
}

.data-item-details strong {
    font-weight: 600;
}

/* Details button in data block */
.details-button {
    background-color: var(--primary-blue);
    color: var(--light-text);
    border: none;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 0.85em;
    cursor: pointer;
    transition: background-color 0.3s ease;
    white-space: nowrap; /* Prevent text wrapping */
}

.details-button:hover {
    background-color: #0056b3;
}

/* Delete button in data block */
.delete-button {
    background-color: #dc3545; /* Red color for delete */
    color: var(--light-text);
    border: none;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 0.85em;
    cursor: pointer;
    transition: background-color 0.3s ease;
    white-space: nowrap;
    margin-left: 10px; /* Space from details */
}

.delete-button:hover {
    background-color: #c82333;
}

/* Receive Waste Button */
.receive-waste-button {
    background-color: #00bcd4; /* Cyan/light blue for receive */
    color: var(--light-text);
    border: none;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 0.85em;
    cursor: pointer;
    transition: background-color 0.3s ease;
    white-space: nowrap;
    margin-right: 10px; /* Space from details */
}

.receive-waste-button:hover {
    background-color: #0097a7;
}

/* Received Status Text */
.received-status {
    font-size: 0.9em;
    font-weight: 600;
    color: #28a745; /* Green */
    white-space: nowrap;
    margin-right: 10px;
}


.dashboard-buttons {
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 20px;
    z-index: 10; /* Bring buttons to front */
    position: relative; /* Needed for z-index to work */
}

.add-data-button {
    background-color: var(--primary-blue);
    color: var(--light-text);
    border: none;
    padding: 12px 25px;
    border-radius: 25px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
    flex-grow: 1; /* Allow buttons to take available space */
    max-width: 300px; /* Limit button width */
}

.add-data-button:hover {
    background-color: #0056b3;
}

/* Analysis button */
.analysis-button {
    background-color: #28a745; /* Green color */
    color: var(--light-text);
    border: none;
    padding: 12px 25px;
    border-radius: 25px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
    flex-grow: 1;
    max-width: 300px;
}

.analysis-button:hover {
    background-color: #218838;
}

/* Edit Profile button */
.edit-profile-button {
    background-color: #ffc107; /* Yellow color */
    color: var(--dark-text); /* Dark text for yellow background */
    border: none;
    padding: 12px 25px;
    border-radius: 25px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
    flex-grow: 1;
    max-width: 300px;
}

.edit-profile-button:hover {
    background-color: #e0a800;
}

/* Knowledge Button */
.knowledge-button {
    background-color: #17a2b8; /* Teal color */
    color: var(--light-text);
    border: none;
    padding: 12px 25px;
    border-radius: 25px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
    flex-grow: 1;
    max-width: 300px;
}

.knowledge-button:hover {
    background-color: #138496;
}

/* Pending Delivery Button */
.pending-delivery-button {
    background-color: #fd7e14; /* Orange color */
    color: var(--light-text);
    border: none;
    padding: 12px 25px;
    border-radius: 25px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
    flex-grow: 1;
    max-width: 300px;
}

.pending-delivery-button:hover {
    background-color: #e66a00;
}

/* Received Waste Button (for farmer list) */
.received-waste-button-list {
    background-color: #6f42c1; /* Purple color */
    color: var(--light-text);
    border: none;
    padding: 12px 25px;
    border-radius: 25px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
    flex-grow: 1;
    max-width: 300px;
}

.received-waste-button-list:hover {
    background-color: #5d35a6;
}


/* Back button on dashboard needs to be styled like other buttons */
.dashboard-buttons .back-button {
    background-color: #6c757d; /* Grey color for back button */
    color: var(--light-text);
    border: none;
    padding: 12px 25px; /* Match add data button padding */
    border-radius: 25px;
    font-size: 1.1em; /* Match add data button font size */
    font-weight: 600; /* Match add data button font weight */
    cursor: pointer;
    transition: background-color 0.3s ease;
    flex-grow: 1;
    max-width: 300px;
}

.back-button:hover {
    background-color: #5a6268;
}

/* Styles for Add Waste Data Page */
.add-waste-container {
    background-color: transparent;
    width: 100%;
    max-width: 900px;
    z-index: 2;
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.add-waste-container h2 {
    color: var(--light-text);
    margin-bottom: 30px;
    font-size: 2.2em;
    font-weight: 700;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
    text-align: center;
}

.add-waste-container form {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.form-row {
    display: flex;
    width: 100%;
    gap: 30px;
    margin-bottom: 30px;
    flex-wrap: wrap;
    justify-content: center;
}

.upload-group {
    background-color: var(--upload-box-bg);
    border-radius: 15px;
    width: 300px;
    height: 250px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.upload-button-label {
    color: var(--light-text);
    font-size: 1.2em;
    font-weight: 600;
    text-align: center;
    padding: 10px;
    z-index: 1;
}

.hidden-input {
    display: none;
}

#imagePreview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 15px;
    z-index: 0;
}

.form-fields-group {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 400px;
}

.add-waste-container .form-group label {
    color: var(--light-text);
    font-size: 1.1em;
}

.add-waste-container input[type="text"],
.add-waste-container input[type="number"],
.add-waste-container input[type="date"] {
    background-color: rgba(255, 255, 255, 0.8);
    border: 1px solid var(--input-border);
    border-radius: 8px;
    font-size: 1em;
    box-sizing: border-box;
    color: var(--dark-text);
}

.add-waste-container input::placeholder {
    color: #666;
}

.form-buttons {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 600px;
    gap: 20px;
    margin-top: 20px;
}

.add-waste-container .back-button,
.add-waste-container .login-button {
    flex-grow: 1;
    max-width: 250px;
}


/* Pending Delivery Page Styles */
.pending-delivery-container,
.received-waste-container,
.qr-code-container {
    background-color: rgba(255, 255, 255, 0.1); /* Semi-transparent background */
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 1000px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.pending-delivery-container h2,
.received-waste-container h2,
.qr-code-container h2 {
    color: var(--light-text);
    margin-bottom: 30px;
    font-size: 2.2em;
    font-weight: 700;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
    text-align: center;
}

.pending-list-area,
.received-list-area {
    width: 100%;
    max-height: 60vh; /* Allow scrolling for lists */
    overflow-y: auto;
    background-color: var(--header-bg);
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

/* QR Code Display Styles */
.qr-code-container .qr-code-box {
    background-color: var(--header-bg);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 20px;
    text-align: center;
    width: fit-content; /* Adjust width to content */
    display: flex;
    flex-direction: column;
    align-items: center;
}
.qr-code-container .qr-code-text {
    font-size: 1.2em;
    font-weight: bold;
    color: var(--dark-text);
    margin-bottom: 15px;
}
.qr-code-container img {
    border: 1px solid #ccc;
    padding: 5px;
    background-color: white;
}

/* Specific button for QR Scan (school) */
.scan-qr-button {
    background-color: #fd7e14; /* Orange */
    color: var(--light-text);
    border: none;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 0.85em;
    cursor: pointer;
    transition: background-color 0.3s ease;
    white-space: nowrap;
    margin-left: 10px; /* Space from details */
}

.scan-qr-button:hover {
    background-color: #e66a00;
}

.show-qr-button { /* for farmer */
    background-color: #6f42c1; /* Purple */
    color: var(--light-text);
    border: none;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 0.85em;
    cursor: pointer;
    transition: background-color 0.3s ease;
    white-space: nowrap;
    margin-left: 10px; /* Space from details */
}
.show-qr-button:hover {
    background-color: #5d35a6;
}


/* Footer Contact Email */
.footer {
    background-color: var(--footer-bg);
    color: var(--light-text);
    text-align: center;
    padding: 15px 0;
    font-size: 0.85em;
    width: 100%;
    position: relative; /* Ensure z-index works */
    z-index: 50; /* Bring footer above potential overlays */
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.footer .contact-email a {
    color: var(--light-text);
    text-decoration: none;
}
.footer .contact-email a:hover {
    text-decoration: underline;
}


/* Responsive Design */
@media (max-width: 768px) {
    .main-question-text {
        font-size: 1.5em;
        margin-bottom: 30px;
    }
    .cards-and-descriptions-wrapper {
        flex-direction: column; /* Stack cards vertically on smaller screens */
        gap: 30px;
    }
    .card-with-description {
        max-width: 90%; /* Make cards wider on smaller screens */
    }
    .card-image {
        height: 250px;
    }
    .button {
        font-size: 1.1em;
        padding: 12px 25px;
    }
    .card-description-text {
        font-size: 0.85em;
    }

    /* School Dashboard Responsive */
    .school-dashboard-container {
        padding: 10px;
        height: auto;
    }
    .dashboard-content-area {
        flex-direction: column;
        height: auto;
    }
    .sidebar {
        width: 100%;
        border-radius: 15px 15px 0 0;
        padding: 15px;
    }
    .main-display-area {
        padding: 15px;
    }
    .dashboard-buttons {
        flex-direction: column;
        gap: 10px;
    }
    .add-data-button,
    .dashboard-buttons .back-button,
    .analysis-button,
    .edit-profile-button,
    .knowledge-button,
    .pending-delivery-button,
    .received-waste-button-list {
        max-width: 100%;
    }

    /* Add Waste Data Page Responsive */
    .add-waste-container {
        padding: 10px;
    }
    .add-waste-container h2 {
        font-size: 1.8em;
    }
    .form-row {
        flex-direction: column;
        gap: 20px;
        align-items: center;
    }
    .upload-group {
        width: 100%;
        max-width: 300px;
        height: 200px;
    }
    .form-fields-group {
        width: 100%;
        max-width: none;
    }
    .form-buttons {
        flex-direction: column;
        gap: 10px;
    }
    .add-waste-container .back-button,
    .add-waste-container .login-button {
        max-width: 100%;
    }

    /* Farmer Dashboard Responsive */
    .farmer-dashboard-container {
        padding: 10px;
        height: auto;
    }
    .farmer-dashboard-container .dashboard-content-area {
        flex-direction: column;
        height: auto;
    }
    .farmer-dashboard-container .sidebar {
        width: 100%;
        border-radius: 15px 15px 0 0;
        padding: 15px;
    }
    .farmer-dashboard-container .main-display-area {
        padding: 15px;
    }
    .filter-group input {
        width: calc(100% - 20px);
    }
    .filter-weight-inputs input {
        width: auto;
    }
    .filter-button {
        width: 100%;
    }

    /* Post Details Page Responsive */
    .post-details-container {
        padding: 20px;
    }
    .post-details-container h2 {
        font-size: 1.8em;
    }
    .details-content {
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }
    .details-image {
        width: 100%;
        max-width: 300px;
        height: auto;
    }
    .details-fields-group {
        width: 100%;
        max-width: none;
        text-align: center;
    }
    .details-fields-group p {
        font-size: 1em;
    }

    /* Modal Responsive */
    .custom-modal-content {
        padding: 20px;
    }
    .modal-buttons {
        flex-direction: column;
        gap: 10px;
    }
    .modal-button {
        width: 100%;
    }

    /* Analysis Page Responsive */
    .analysis-container {
        padding: 15px;
    }
    .analysis-container h2 {
        font-size: 1.8em;
    }
    .chart-container {
        height: 300px;
    }

    /* Edit Profile Page Responsive */
    .edit-profile-container {
        padding: 15px;
    }
    .edit-profile-container h2 {
        font-size: 1.8em;
    }

    /* Knowledge Page Responsive */
    .knowledge-container {
        padding: 15px;
    }
    .knowledge-container h2 {
        font-size: 1.8em;
    }
    .knowledge-content {
        padding: 15px;
    }
    .knowledge-content h3 {
        font-size: 1.3em;
    }
    .knowledge-content p, .knowledge-content li {
        font-size: 0.9em;
    }

    /* Pending/Received List Responsive */
    .pending-delivery-container, .received-waste-container {
        padding: 10px;
    }
    .pending-delivery-container h2, .received-waste-container h2 {
        font-size: 1.8em;
    }
    .pending-list-area, .received-list-area {
        padding: 15px;
    }
    .data-block.pending-item, .data-block.received-item {
        flex-direction: column;
        text-align: center;
    }
    .data-block.pending-item .data-item-image, .data-block.received-item .data-item-image {
        margin-bottom: 10px;
    }
    .data-block.pending-item .scan-qr-button,
    .data-block.received-item .show-qr-button {
        margin-top: 10px;
        margin-left: 0;
        width: 100%;
    }
}

@media (max-width: 480px) {
    .main-question-text {
        font-size: 1.2em;
        margin-bottom: 20px;
    }
    .card-image {
        height: 200px;
    }
    .button {
        font-size: 1em;
        padding: 10px 20px;
    }
    .card-description-text {
        font-size: 0.8em;
    }

    /* School Dashboard Responsive */
    /* Farmer Dashboard Responsive */
    .farmer-dashboard-container .sidebar h3 {
        font-size: 1.3em;
    }
    .data-block {
        flex-direction: column;
        text-align: center;
    }
    .data-item-image {
        margin-bottom: 10px;
    }

    /* Add Waste Data Page Responsive */
    .add-waste-container h2 {
        font-size: 1.5em;
    }
    .upload-button-label {
        font-size: 1em;
    }

    /* Post Details Page Responsive */
    .post-details-container h2 {
        font-size: 1.5em;
    }
    .details-fields-group p {
        font-size: 0.9em;
    }

    /* Analysis Page Responsive */
    .analysis-container h2 {
        font-size: 1.5em;
    }
    .chart-container {
        height: 250px;
    }

    /* Edit Profile Page Responsive */
    .edit-profile-container h2 {
        font-size: 1.5em;
    }

    /* Knowledge Page Responsive */
    .knowledge-container h2 {
        font-size: 1.5em;
    }
}
