// NEW: Firebase Configuration
// TODO: PASTE YOUR FIREBASE CONFIG OBJECT HERE FROM FIREBASE CONSOLE
// *** IMPORTANT: Replace all "YOUR_..." placeholders with your actual Firebase project config ***
const firebaseConfig = {
    apiKey: "AIzaSyCjtbAuyePzeC6TbnbautvwUnxzcyxPvkw",
    authDomain: "phuket-food-hero-bdf99.firebaseapp.com",
    projectId: "phuket-food-hero-bdf99",
    storageBucket: "phuket-food-hero-bdf99.firebasestorage.app",
    messagingSenderId: "186105687007",
    appId: "1:186105687007:web:7f4395dfea7e8ac942326a",
    measurementId: "G-56SEESNQWF"
};
// --- IMPORTANT FIX: Declare auth, db, storage globally ---
let auth;
let db;
let storage;
// --- END IMPORTANT FIX ---

// Initialize Firebase
try {
    const firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("Firebase initialized successfully. Auth, DB, Storage objects are accessible.");
} catch (initError) {
    console.error("Failed to initialize Firebase:", initError);
    alert("เกิดข้อผิดพลาดในการเริ่มต้น Firebase: " + initError.message + ". โปรดตรวจสอบ Firebase Config และ API Key ใน script.js");
}

// --- HELPER FUNCTIONS (General utilities, UI components) ---

// Helper function to calculate stars (1 star for every 10 actions)
const calculateStars = (count) => {
    return Math.floor(count / 10);
};

// Helper function to remove undefined properties from an object
function cleanObject(obj) {
    const newObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
            newObj[key] = obj[key];
        }
    }
    return newObj;
}

// Custom Confirmation Modal
function showConfirmationModal(message, onConfirm) {
    // ลบ modal เดิมถ้ามี
    const oldModal = document.getElementById('confirmationModalOverlay');
    if (oldModal) oldModal.remove();

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

    // ผูก event หลัง modal ถูกเพิ่มใน DOM
    setTimeout(() => {
        const confirmYesBtn = document.getElementById('confirmYes');
        const confirmNoBtn = document.getElementById('confirmNo');
        const modalOverlay = document.getElementById('confirmationModalOverlay');

        if (confirmYesBtn) {
            confirmYesBtn.addEventListener('click', () => {
                console.log('YES button clicked');
                onConfirm();
                if (modalOverlay) modalOverlay.remove();
            });
        } else {
            console.warn('YES button not found in modal!');
        }
        if (confirmNoBtn) {
            confirmNoBtn.addEventListener('click', () => {
                console.log('NO button clicked');
                if (modalOverlay) modalOverlay.remove();
            });
        } else {
            console.warn('NO button not found in modal!');
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.remove();
                }
            });
        }
    }, 0);
}

// Thai Location Data (Simplified Example) and associated functions
const thaiLocations = {
    "ภูเก็ต": {
    "เมืองภูเก็ต": ["ตลาดใหญ่", "ตลาดเหนือ", "รัษฎา", "วิชิต", "ฉลอง", "เกาะแก้ว", "ราไวย์", "กะรน"],
    "กะทู้": ["กะทู้", "ป่าตอง", "กมลา"],
    "ถลาง": ["เทพกระษัตรี", "ศรีสุนทร", "เชิงทะเล", "ป่าคลอก", "ไม้ขาว", "สาคู"]
    },
   // "กระบี่": {
     //   "เมืองกระบี่": ["กระบี่ใหญ่", "กระบี่น้อย", "ไสไทย"],
       // "อ่าวลึก": ["อ่าวลึกเหนือ", "แหลมสัก"]
   // },
    //"พังงา": {
      //  "เมืองพังงา": ["ท้ายช้าง", "ถ้ำน้ำผุด"],
        //"ตะกั่วป่า": ["ตะกั่วป่า", "บางนายสี"]
    //}
};

function populateProvinces(provinceSelectId, selectedProvince = '') {
    const provinceSelect = document.getElementById(provinceSelectId);
    if (!provinceSelect) return;

    provinceSelect.innerHTML = '<option value="">-- เลือกจังหวัด --</option>';
    for (const province in thaiLocations) {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        if (province === selectedProvince) {
            option.selected = true;
        }
        provinceSelect.appendChild(option);
    }
    if (selectedProvince) {
        let districtSelectId, subdistrictSelectId;
        if (provinceSelectId.includes('edit')) {
            districtSelectId = provinceSelectId.replace('Province', 'District');
            subdistrictSelectId = provinceSelectId.replace('Province', 'Subdistrict');
        } else {
            districtSelectId = provinceSelectId.replace('province', 'district');
            subdistrictSelectId = provinceSelectId.replace('province', 'subdistrict');
        }

        const districtSelect = document.getElementById(districtSelectId);
        if (districtSelect) districtSelect.disabled = false;
    }
}

function populateDistricts(provinceSelectId, districtSelectId, subdistrictSelectId, selectedDistrict = '') {
    const provinceSelect = document.getElementById(provinceSelectId);
    const districtSelect = document.getElementById(districtSelectId);
    const subdistrictSelect = document.getElementById(subdistrictSelectId);

    if (!provinceSelect || !districtSelect || !subdistrictSelect) return;

    districtSelect.innerHTML = '<option value="">-- เลือกอำเภอ --</option>';
    subdistrictSelect.innerHTML = '<option value="">-- เลือกตำบล --</option>';
    districtSelect.disabled = true;
    subdistrictSelect.disabled = true;

    const selectedProvince = provinceSelect.value;
    if (selectedProvince && thaiLocations[selectedProvince]) {
        for (const district in thaiLocations[selectedProvince]) {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            if (district === selectedDistrict) {
                option.selected = true;
            }
            districtSelect.appendChild(option);
        }
        districtSelect.disabled = false;
    }
    if (selectedDistrict) {
        populateSubdistricts(districtSelectId, subdistrictSelectId, subdistrictSelect.dataset.preselected || '');
    }
}

function populateSubdistricts(districtSelectId, subdistrictSelectId, selectedSubdistrict = '') {
    const districtSelect = document.getElementById(districtSelectId);
    const subdistrictSelect = document.getElementById(subdistrictSelectId);

    if (!districtSelect || !subdistrictSelect) return;

    subdistrictSelect.innerHTML = '<option value="">-- เลือกตำบล --</option>';
    subdistrictSelect.disabled = true;

    let provinceSelectId;
    if (districtSelectId.includes('edit')) {
        provinceSelectId = districtSelectId.replace('District', 'Province');
    } else if (districtSelectId.includes('farmer')) {
         provinceSelectId = districtSelectId.replace('District', 'Province');
    }
    else {
        provinceSelectId = districtSelectId.replace('district', 'province');
    }

    const provinceSelect = document.getElementById(provinceSelectId);
    const selectedProvince = provinceSelect ? provinceSelect.value : '';
    const selectedDistrict = districtSelect.value;

    if (selectedProvince && selectedDistrict && thaiLocations[selectedProvince] && thaiLocations[selectedProvince][selectedDistrict]) {
        thaiLocations[selectedProvince][selectedDistrict].forEach(subdistrict => {
            const option = document.createElement('option');
            option.value = subdistrict;
            option.textContent = subdistrict;
            if (subdistrict === selectedSubdistrict) {
                option.selected = true;
            }
            subdistrictSelect.appendChild(option);
        });
        subdistrictSelect.disabled = false;
    }
}

// Functions to handle "Other" option in dropdowns
function toggleOtherPurposeInput() {
    const purposeSelect = document.getElementById('purposeSelect');
    const otherPurposeInput = document.getElementById('otherPurposeInput');
    const otherPurposeTextarea = document.getElementById('otherPurpose');

    if (purposeSelect && otherPurposeInput && otherPurposeTextarea) {
        if (purposeSelect.value === 'other') {
            otherPurposeInput.style.display = 'block';
            otherPurposeTextarea.setAttribute('required', 'true');
        } else {
            otherPurposeInput.style.display = 'none';
            otherPurposeTextarea.removeAttribute('required');
            otherPurposeTextarea.value = '';
        }
    }
}

function toggleEditOtherPurposeInput() {
    const purposeSelect = document.getElementById('editPurposeSelect');
    const otherPurposeInput = document.getElementById('editOtherPurposeInput');
    const otherPurposeTextarea = document.getElementById('editOtherPurpose');

    if (purposeSelect && otherPurposeInput && otherPurposeTextarea) {
        if (purposeSelect.value === 'other') {
            otherPurposeInput.style.display = 'block';
            otherPurposeTextarea.setAttribute('required', 'true');
        } else {
            otherPurposeInput.style.display = 'none';
            otherPurposeTextarea.removeAttribute('required');
            otherPurposeTextarea.value = '';
        }
    }
}

// --- FIREBASE AUTHENTICATION & DATA HANDLING FUNCTIONS (Core logic) ---

async function handleAuthSubmission(email, password, role, additionalData = {}) {
    let currentUser;
    let userDocRef;

    if (password.length < 6) {
        alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        if (!currentUser || !currentUser.uid) {
            console.error("Auth Error: currentUser or UID is undefined after createUserWithEmailAndPassword.");
            alert('ลงทะเบียนไม่สำเร็จ: ผู้ใช้ไม่ได้ถูกสร้างอย่างถูกต้อง (UID หายไป)');
            loadLandingPage();
            return;
        }
        console.log("Firebase Auth: User created with UID:", currentUser.uid);
        
        try {
            userDocRef = db.collection('users').doc(currentUser.uid);
            const dataToSet = cleanObject({
                email: email,
                role: role,
                wastePostsCount: 0,
                wasteReceivedCount: 0,
                stars: 0,
                ...additionalData
            });

            await userDocRef.set(dataToSet);
            console.log("Firestore: User document created for UID:", currentUser.uid);
            alert('ลงทะเบียนและเข้าสู่ระบบสำเร็จ!');
        } catch (firestoreError) {
            console.error("Firestore Error during user document creation:", firestoreError);
            alert('ลงทะเบียนไม่สำเร็จ: ไม่สามารถบันทึกข้อมูลโปรไฟล์ (อาจเกิดจากกฎความปลอดภัยหรือปัญหาฐานข้อมูล): ' + firestoreError.message);
            if (auth.currentUser) {
                await auth.currentUser.delete();
            }
            await auth.signOut();
            loadLandingPage();
            return;
        }

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('User already registered in Firebase Auth, attempting login...');
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                currentUser = userCredential.user;
                
                if (!currentUser || !currentUser.uid) {
                    console.error("Auth Error: currentUser or UID is undefined after signInWithEmailAndPassword.");
                    alert('เข้าสู่ระบบล้มเหลว: ไม่สามารถระบุผู้ใช้ได้');
                    await auth.signOut();
                    loadLandingPage();
                    return;
                }
                console.log("Firebase Auth: User signed in with existing account. UID:", currentUser.uid);
                
                alert('เข้าสู่ระบบสำเร็จ!');
            } catch (loginError) {
                alert('เข้าสู่ระบบล้มเหลว: ' + (loginError.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
                console.error('Login Error during re-attempt:', loginError);
                return;
            }
        } else {
            alert('ลงทะเบียนไม่สำเร็จ: ' + (error.message || 'เกิดข้อผิดพลาด'));
            console.error('Registration Error:', error);
            return;
        }
    }

    if (currentUser && currentUser.uid) {
        console.log("Attempting to fetch user document from Firestore for UID:", currentUser.uid);
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            console.log("Firestore: User document found.");
            const userDataFromFirestore = userDoc.data();
            localStorage.setItem('userRole', userDataFromFirestore.role);
            localStorage.setItem('userId', currentUser.uid);
            localStorage.setItem('userStars', userDataFromFirestore.stars || 0);
            if (userDataFromFirestore.role === 'farmer' && userDataFromFirestore.subDistrict) {
                localStorage.setItem('userSubDistrict', userDataFromFirestore.subDistrict);
            }

            if (userDataFromFirestore.role === 'school') {
                loadSchoolDashboard();
            } else if (userDataFromFirestore.role === 'farmer') {
                loadFarmerDashboard();
            }
        } else {
            console.error("Firestore Error: User document NOT found for UID:", currentUser.uid, ". This user exists in Auth but not Firestore. Automatic logout initiated.");
            alert('ไม่พบข้อมูลโปรไฟล์ผู้ใช้ กรุณาลงทะเบียนใหม่');
            await auth.signOut();
            loadLandingPage();
        }
    } else {
        console.error("handleAuthSubmission final check: currentUser or currentUser.uid is missing after all attempts.");
        alert("เกิดข้อผิดพลาดภายในระบบ: ไม่สามารถยืนยันผู้ใช้ได้");
        loadLandingPage();
    }
}

async function genericLoginAttempt(email, password) {
    if (password.length < 6) {
        alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
    }
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const currentUser = userCredential.user;
        
        if (!currentUser || !currentUser.uid) {
            console.error("Auth Error: currentUser or UID is undefined after signInWithEmailAndPassword (generic).");
            alert('เข้าสู่ระบบล้มเหลว: ไม่สามารถระบุผู้ใช้ได้');
            await auth.signOut();
            loadLandingPage();
            return;
        }
        console.log("Firebase Auth: Generic login successful. UID:", currentUser.uid);

        localStorage.setItem('userId', currentUser.uid);

        console.log("Attempting to fetch user document from Firestore for UID:", currentUser.uid);
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            console.log("Firestore: User document found during generic login.");
            const userDataFromFirestore = userDoc.data();
            localStorage.setItem('userRole', userDataFromFirestore.role);
            localStorage.setItem('userStars', userDataFromFirestore.stars || 0);
            if (userDataFromFirestore.role === 'farmer' && userDataFromFirestore.subDistrict) {
                localStorage.setItem('userSubDistrict', userDataFromFirestore.subDistrict);
            }

            alert('เข้าสู่ระบบสำเร็จ!');
            if (userDataFromFirestore.role === 'school') {
                loadSchoolDashboard();
            } else if (userDataFromFirestore.role === 'farmer') {
                loadFarmerDashboard();
            }
        } else {
            console.error("Firestore Error: User document NOT found for UID:", currentUser.uid, ". This user exists in Auth but not Firestore. Automatic logout initiated.");
            alert('ไม่พบข้อมูลโปรไฟล์ผู้ใช้ กรุณาลงทะเบียนใหม่');
            await auth.signOut();
            loadLandingPage();
        }

    } catch (error) {
        alert('เข้าสู่ระบบล้มเหลว: ' + (error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
        console.error('Generic Login Error:', error);
    }
}

// Function to delete waste entry
async function deleteWasteEntry(id) {
    console.log('Frontend attempting to delete ID:', id);
    try {
        const wasteEntryRef = db.collection('wasteentries').doc(id);
        const wasteEntryDoc = await wasteEntryRef.get();

        if (!wasteEntryDoc.exists) {
            alert('ไม่พบข้อมูลเศษอาหารที่จะลบ');
            return;
        }
        const wasteEntryData = wasteEntryDoc.data();

        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId || wasteEntryData.schoolId !== userId) {
            alert('ไม่ได้รับอนุญาตให้ลบข้อมูลนี้');
            return;
        }

        if (wasteEntryData.imageUrl) {
            try {
                const imageRef = storage.refFromURL(wasteEntryData.imageUrl);
                await imageRef.delete();
                console.log('Image deleted from Firebase Storage.');
            } catch (storageError) {
                console.error('Error deleting image from Firebase Storage:', storageError);
            }
        }

        await wasteEntryRef.delete();

        const schoolUserRef = db.collection('users').doc(userId);
        await db.runTransaction(async (transaction) => {
            const schoolUserDoc = await transaction.get(schoolUserRef);
            if (schoolUserDoc.exists) {
                const newWastePostsCount = Math.max(0, (schoolUserDoc.data().wastePostsCount || 0) - 1);
                const newStars = calculateStars(newWastePostsCount);
                transaction.update(schoolUserRef, {
                    wastePostsCount: newWastePostsCount,
                    stars: newStars
                });
                localStorage.setItem('userStars', newStars);
            }
        });

        alert('ลบข้อมูลสำเร็จ!');
        loadSchoolDashboard();
    } catch (error) {
        console.error('Delete Waste Error:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message);
    }
}

// Handle Receive Waste Function (for Farmer)
async function handleReceiveWaste(wasteId) {
    console.log(`Frontend sending receive request for ID: ${wasteId}`);
    try {
        const wasteEntryRef = db.collection('wasteentries').doc(wasteId);
        const wasteEntryDoc = await wasteEntryRef.get();

        if (!wasteEntryDoc.exists) {
            alert('ไม่พบข้อมูลเศษอาหารที่จะรับ');
            return;
        }
        const wasteEntryData = wasteEntryDoc.data();
        if (wasteEntryData.isReceived) {
            alert('เศษอาหารนี้ถูกรับไปแล้ว');
            return;
        }

        const farmerUserId = auth.currentUser ? auth.currentUser.uid : null;
        if (!farmerUserId) {
             alert('กรุณาเข้าสู่ระบบในฐานะเกษตรกรเพื่อรับเศษอาหาร');
             return;
        }

        await wasteEntryRef.update({
            isReceived: true,
            receivedBy: farmerUserId,
            receivedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        const farmerUserRef = db.collection('users').doc(farmerUserId);
        await db.runTransaction(async (transaction) => {
            const farmerUserDoc = await transaction.get(farmerUserRef);
            if (farmerUserDoc.exists) {
                const newWasteReceivedCount = (farmerUserDoc.data().wasteReceivedCount || 0) + 1;
                const newStars = calculateStars(newWasteReceivedCount);
                transaction.update(farmerUserRef, {
                    wasteReceivedCount: newWasteReceivedCount,
                    stars: newStars
                });
                localStorage.setItem('userStars', newStars);
            }
        });

        alert('ยืนยันการรับเศษอาหารสำเร็จ!');
        loadFarmerDashboard();
    } catch (error) {
        console.error('Receive Waste Error:', error);
        alert('เกิดข้อผิดพลาดในการรับเศษอาหาร: ' + error.message);
    }
}

// Handle Confirm Delivery Function (for School, after QR scan)
async function handleConfirmDelivery(wasteId) {
    console.log(`Frontend sending confirm delivery request for ID: ${wasteId}`);
    try {
        const wasteEntryRef = db.collection('wasteentries').doc(wasteId);
        const wasteEntryDoc = await wasteEntryRef.get();

        if (!wasteEntryDoc.exists) {
            alert('ไม่พบข้อมูลเศษอาหารที่จะยืนยัน');
            return;
        }
        const wasteEntryData = wasteEntryDoc.data();

        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId || wasteEntryData.schoolId !== userId) {
            alert('คุณไม่ได้รับอนุญาตให้ยืนยันการส่งมอบข้อมูลนี้');
            return;
        }

        if (wasteEntryData.isDelivered) {
            alert('เศษอาหารนี้ถูกส่งมอบไปแล้ว');
            return;
        }
        if (!wasteEntryData.isReceived) {
            alert('เศษอาหารนี้ยังไม่ถูกเกษตรกรรับไป');
            return;
        }

        await wasteEntryRef.update({
            isDelivered: true,
            deliveredAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // เพิ่มการอัปเดต collection totalwaste
        if (wasteEntryData.menu && typeof wasteEntryData.weight === 'number') {
            const menuName = wasteEntryData.menu;
            const weight = wasteEntryData.weight;
            const totalWasteRef = db.collection('totalwaste').doc(menuName);
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(totalWasteRef);
                if (doc.exists) {
                    const prev = doc.data().totalWeight || 0;
                    transaction.update(totalWasteRef, { totalWeight: prev + weight });
                } else {
                    transaction.set(totalWasteRef, { menu: menuName, totalWeight: weight });
                }
            });
        }

        alert('ยืนยันการส่งมอบเศษอาหารสำเร็จ!');
        loadPendingDeliveryPage();
    } catch (error) {
        console.error('Confirm Delivery Error:', error);
        alert('เกิดข้อผิดพลาดในการยืนยันการส่งมอบ: ' + error.message);
    }
}

// Helper function to render data blocks dynamically
async function renderDataBlocks(data, targetWrapperId) {
    const wrapper = document.querySelector(targetWrapperId);
    if (!wrapper) return;

    wrapper.innerHTML = '';

    console.log(`Rendering data blocks for ${targetWrapperId}. Data received COUNT:`, data.length, "Data:", data);

    if (data.length === 0) {
        wrapper.innerHTML = '<p style="color: #666; text-align: center; margin-top: 30px;">ไม่พบข้อมูล</p>';
        return;
    }

    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');

    let userStars = 0;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if(userDoc.exists) {
            userStars = userDoc.data().stars || 0;
            localStorage.setItem('userStars', userStars);
        }
    } catch (error) {
        console.error('Failed to fetch user stars:', error);
    }
    const userStarsElement = document.querySelector('.user-stars');
    if (userStarsElement) {
        userStarsElement.textContent = `⭐ ${userStars} ดาว`;
    }

    data.forEach(item => {
        const dataBlock = document.createElement('div');
        dataBlock.classList.add('data-block');
        dataBlock.dataset.id = item.id;

        const date = item.date ? new Date(item.date.toDate()).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric'
        }) : 'ไม่ระบุ';

        const postedAt = item.postedAt ? new Date(item.postedAt.toDate()).toLocaleTimeString('th-TH', {
            hour: '2-digit', minute: '2-digit'
        }) : 'ไม่ระบุ';

        const schoolName = item.schoolInfo ? item.schoolInfo.instituteName : 'ไม่ระบุโรงเรียน/ร้านอาหาร';
        const schoolContact = item.schoolInfo ? item.schoolInfo.contactNumber : 'ไม่ระบุ';
        const schoolEmail = item.schoolInfo ? item.schoolInfo.email : 'ไม่ระบุ';
        const schoolFullAddress = item.schoolInfo ? 
            `${item.schoolInfo.address || ''} ${item.schoolInfo.subdistrict || ''} ${item.schoolInfo.district || ''} ${item.schoolInfo.province || ''}`.trim() : 'ไม่ระบุที่อยู่';

        let actionButtonsHtml = '';
        if (targetWrapperId === '#schoolDataBlocks') {
            if (item.schoolId === userId && !item.isDelivered) {
                actionButtonsHtml += `<button class="delete-button" data-id="${item.id}">ลบ</button>`;
            } else if (item.schoolId === userId && item.isDelivered) {
                actionButtonsHtml += `<p class="status-delivered">ส่งมอบแล้ว</p>`;
            }
        } else if (targetWrapperId === '#farmerDataBlocks') {
            if (!item.isReceived) {
                actionButtonsHtml += `
                    <button class="receive-waste-button" data-id="${item.id}">รับเศษอาหาร</button>
                    <button class="details-button" data-id="${item.id}">รายละเอียด</button>
                `;
            } else if (item.isReceived) {
                actionButtonsHtml += `
                    <p class="received-status">รับแล้ว</p>
                    <button class="details-button" data-id="${item.id}">รายละเอียด</button>
                `;
                // เพิ่มปุ่มลบเฉพาะโพสต์ที่เกษตรกรเป็นผู้รับ
                if (item.receivedBy === userId) {
                    actionButtonsHtml += `<button class="delete-button" data-id="${item.id}">ลบ</button>`;
                }
            }
        } else if (targetWrapperId === '#pendingDeliveryBlocks' && userRole === 'school') {
            if (item.isReceived && !item.isDelivered) {
                actionButtonsHtml += `
                    <button class="scan-qr-button" data-id="${item.id}">สแกน QR Code เพื่อยืนยัน</button>
                `;
            }
        } else if (targetWrapperId === '#receivedWasteBlocks' && userRole === 'farmer') {
            if (item.receivedBy === userId) {
                actionButtonsHtml += `
                    <p>สถานะ: <span class="${item.isDelivered ? 'status-delivered' : 'status-pending'}">${item.isDelivered ? 'ส่งมอบแล้ว' : 'รอส่งมอบ'}</span></p>
                    <button class="show-qr-button" data-id="${item.id}">แสดง QR Code</button> `;
            }
        }

        dataBlock.innerHTML = `
            <img src="${item.imageUrl || 'https://placehold.co/150x120/ADD8E6/000000?text=No+Image'}" alt="Waste Image" class="data-item-image">
            <div class="data-item-details">
                <p><strong>เมนู:</strong> ${item.menu}</p>
                <p><strong>ปริมาณ:</strong> ${item.weight} kg</p>
                <p><strong>วันที่:</strong> ${date} (${postedAt})</p>
                <p><strong>จาก:</strong> ${schoolName}</p>
                <p><strong>ที่อยู่:</strong> ${schoolFullAddress}</p> <p><strong>ติดต่อ:</strong> ${schoolContact}</p>
            </div>
            <div class="data-block-actions"> ${actionButtonsHtml}
            </div>
        `;
        wrapper.appendChild(dataBlock);
    });

    if (userRole === 'school' && targetWrapperId === '#schoolDataBlocks') {
        wrapper.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const wasteId = e.target.dataset.id;
                showConfirmationModal('คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?', () => deleteWasteEntry(wasteId));
            });
        });
    } else if (userRole === 'farmer' && targetWrapperId === '#farmerDataBlocks') {
        wrapper.querySelectorAll('.details-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const postId = e.target.dataset.id;
                loadPostDetails(postId);
            });
        });
        wrapper.querySelectorAll('.receive-waste-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const wasteId = e.target.dataset.id;
                showConfirmationModal('คุณต้องการรับเศษอาหารนี้หรือไม่?', () => handleReceiveWaste(wasteId));
            });
        });
        // เพิ่ม event สำหรับปุ่มลบของเกษตรกร
        wrapper.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const wasteId = e.target.dataset.id;
                showConfirmationModal('คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?', () => deleteWasteEntryForFarmer(wasteId));
            });
        });
    } else if (userRole === 'school' && targetWrapperId === '#pendingDeliveryBlocks') {
        wrapper.querySelectorAll('.scan-qr-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const wasteId = e.target.dataset.id;
                showConfirmationModal('คุณแน่ใจหรือไม่ที่จะยืนยันการส่งมอบเศษอาหารนี้?', async () => {
                    const qrValue = prompt('กรุณากรอก Waste ID ที่แสดงบน QR Code ของเกษตรกรเพื่อยืนยันการส่งมอบ');
                    if (qrValue && qrValue === wasteId) {
                        await handleConfirmDelivery(wasteId);
                    } else if (qrValue) {
                        alert('รหัส QR Code ไม่ตรงกับรายการที่เลือก');
                    } else {
                        alert('การยืนยันถูกยกเลิก');
                    }
                });
            });
        });
    } else if (userRole === 'farmer' && targetWrapperId === '#receivedWasteBlocks') {
        wrapper.querySelectorAll('.show-qr-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const wasteId = e.target.dataset.id;
                loadQRCodeDisplayPage(wasteId);
            });
        });
    }
}

// --- MAIN PAGE LOADING FUNCTIONS ---
// These functions orchestrate which HTML content and data to load.
// They are declared here to ensure all dependencies are met before being called.

function loadContent(contentHtml) {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = contentHtml;
    console.log("loadContent called. HTML loaded into app-container.");

    // --- Common Event Listeners (attached after content is loaded) ---
    // These listeners are attached every time contentHtml is loaded,
    // ensuring they always work for newly rendered elements.
    if (document.getElementById('backToMain')) {
        document.getElementById('backToMain').addEventListener('click', loadLandingPage);
    }
    if (document.getElementById('backToMainFromDashboard')) {
        document.getElementById('backToMainFromDashboard').addEventListener('click', loadLandingPage);
    }
    if (document.getElementById('backFromAddWasteData')) {
        document.getElementById('backFromAddWasteData').addEventListener('click', loadSchoolDashboard);
    }
    if (document.getElementById('backFromPostDetails')) {
        document.getElementById('backFromPostDetails').addEventListener('click', loadFarmerDashboard);
    }
    if (document.getElementById('backFromGenericLogin')) {
        document.getElementById('backFromGenericLogin').addEventListener('click', loadLandingPage);
    }
    if (document.getElementById('backFromAnalysis')) {
        document.getElementById('backFromAnalysis').addEventListener('click', loadSchoolDashboard);
    }
    if (document.getElementById('backFromEditProfile')) {
        document.getElementById('backFromEditProfile').addEventListener('click', () => {
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'school') {
                loadSchoolDashboard();
            } else if (userRole === 'farmer') {
                loadFarmerDashboard();
            } else {
                loadLandingPage();
            }
        });
    }
    if (document.getElementById('backFromKnowledge')) {
        document.getElementById('backFromKnowledge').addEventListener('click', () => {
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'school') {
                loadSchoolDashboard();
            } else if (userRole === 'farmer') {
                loadFarmerDashboard();
            } else {
                loadLandingPage();
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
        document.getElementById('backFromQRScan').addEventListener('click', loadReceivedWastePage);
    }

    // --- Page Specific Event Listeners (dynamic content requiring functions defined above) ---
    // These need to be re-attached every time the content changes.
    // Ensure the element actually exists before trying to add event listener.
    if (document.getElementById('purposeSelect')) {
        document.getElementById('purposeSelect').addEventListener('change', toggleOtherPurposeInput);
    }
    if (document.getElementById('editPurposeSelect')) {
        document.getElementById('editPurposeSelect').addEventListener('change', toggleEditOtherPurposeInput);
    }
    if (document.getElementById('provinceSelect')) {
        document.getElementById('provinceSelect').addEventListener('change', () => populateDistricts('provinceSelect', 'districtSelect', 'subdistrictSelect'));
    }
    if (document.getElementById('districtSelect')) {
        document.getElementById('districtSelect').addEventListener('change', () => populateSubdistricts('districtSelect', 'subdistrictSelect'));
    }
    if (document.getElementById('editProvinceSelect')) {
        document.getElementById('editProvinceSelect').addEventListener('change', () => populateDistricts('editProvinceSelect', 'editDistrictSelect', 'editSubdistrictSelect'));
    }
    if (document.getElementById('editDistrictSelect')) {
        document.getElementById('editDistrictSelect').addEventListener('change', () => populateSubdistricts('editDistrictSelect', 'editSubdistrictSelect'));
    }
    if (document.getElementById('farmerProvince')) {
        document.getElementById('farmerProvince').addEventListener('change', () => populateDistricts('farmerProvince', 'farmerDistrict', 'farmerSubDistrict'));
    }
    if (document.getElementById('farmerDistrict')) {
        document.getElementById('farmerDistrict').addEventListener('change', () => populateSubdistricts('farmerDistrict', 'farmerSubDistrict'));
    }
    if (document.getElementById('editFarmerProvince')) {
        document.getElementById('editFarmerProvince').addEventListener('change', () => populateDistricts('editFarmerProvince', 'editFarmerDistrict', 'editFarmerSubDistrict'));
    }
    if (document.getElementById('editFarmerDistrict')) {
        document.getElementById('editFarmerDistrict').addEventListener('change', () => populateSubdistricts('editFarmerDistrict', 'editFarmerSubDistrict'));
    }

    // New Landing Page specific button
    if (document.getElementById('goToRoleSelection')) {
        document.getElementById('goToRoleSelection').addEventListener('click', loadRoleSelectionPage);
    }

    // Role selection buttons
    if (document.getElementById('schoolButton')) {
        document.getElementById('schoolButton').addEventListener('click', () => loadContent(getSchoolLoginPageHtml()));
    }
    if (document.getElementById('farmerButton')) {
        document.getElementById('farmerButton').addEventListener('click', () => loadContent(getFarmerLoginPageHtml()));
    }

    // Form submission listeners
    const schoolLoginForm = document.getElementById('schoolLoginForm');
    if (schoolLoginForm) {
        schoolLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(schoolLoginForm);
            const email = formData.get('email');
            const password = formData.get('password');
            const additionalData = {
                instituteName: formData.get('instituteName'),
                province: formData.get('province'),
                district: formData.get('district'),
                subdistrict: formData.get('subdistrict'),
                contactNumber: formData.get('contactNumber')
            };
            await handleAuthSubmission(email, password, 'school', additionalData);
        });
        populateProvinces('provinceSelect'); // Populate provinces when school login page loads
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

            const address = formData.get('address');
            const province = formData.get('province');
            const district = formData.get('district');
            const subDistrict = formData.get('subDistrict');

            const additionalData = {
                name: formData.get('name'),
                contactNumber: formData.get('contactNumber'),
                address: address,
                province: province,
                district: district,
                subDistrict: subDistrict,
                purpose: purpose,
                ...(purpose === 'other' && otherPurpose.trim() !== '' ? { otherPurpose: otherPurpose } : {})
            };

            if (purpose === 'other' && !otherPurpose.trim()) {
                alert('กรุณาระบุความต้องการอื่นๆ');
                return;
            }

            await handleAuthSubmission(email, password, 'farmer', additionalData);
        });
        populateProvinces('farmerProvince'); // Populate provinces for farmer login
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
            const menu = formData.get('menu');
            const weight = parseFloat(formData.get('weight'));
            const date = formData.get('date');
            const imageUrlFile = formData.get('wasteImage');

            try {
                let imageUrl = null;
                if (imageUrlFile && imageUrlFile.size > 0) {
                    const storageRef = storage.ref(`waste_images/${Date.now()}_${imageUrlFile.name}`);
                    const uploadTask = storageRef.put(imageUrlFile);

                    await uploadTask;
                    imageUrl = await storageRef.getDownloadURL();
                }

                const userId = auth.currentUser ? auth.currentUser.uid : null;
                if (!userId) {
                    alert('กรุณาเข้าสู่ระบบก่อนโพสต์ข้อมูล');
                    return;
                }

                await db.collection('wasteentries').add({
                    schoolId: userId,
                    menu,
                    weight,
                    date: firebase.firestore.Timestamp.fromDate(new Date(date)),
                    imageUrl,
                    postedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isReceived: false,
                    isDelivered: false
                });

                const schoolUserRef = db.collection('users').doc(userId);
                await db.runTransaction(async (transaction) => {
                    const schoolUserDoc = await transaction.get(schoolUserRef);
                    if (schoolUserDoc.exists) {
                        const newWastePostsCount = Math.max(0, (schoolUserDoc.data().wastePostsCount || 0) + 1);
                        const newStars = calculateStars(newWastePostsCount);
                        transaction.update(schoolUserRef, {
                            wastePostsCount: newWastePostsCount,
                            stars: newStars
                        });
                        localStorage.setItem('userStars', newStars);
                    }
                });

                alert('บันทึกข้อมูลเศษอาหารสำเร็จ!');
                loadSchoolDashboard();
            } catch (error) {
                console.error('Add Waste Error:', error);
                alert('บันทึกข้อมูลไม่สำเร็จ: ' + error.message);
            }
        });

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
            const userId = auth.currentUser ? auth.currentUser.uid : null;
            if (!userId) { alert('กรุณาเข้าสู่ระบบเพื่อแก้ไขโปรไฟล์'); return; }
            
            const formData = new FormData(editProfileForm);
            const userRole = localStorage.getItem('userRole');
            
            let updateData = {};

            if (userRole === 'school') {
                updateData = cleanObject({
                    instituteName: formData.get('instituteName'),
                    province: formData.get('province'),
                    district: formData.get('district'),
                    subdistrict: formData.get('subdistrict'),
                    contactNumber: formData.get('contactNumber')
                });
            } else if (userRole === 'farmer') {
                const purpose = formData.get('purpose');
                const otherPurpose = formData.get('otherPurpose');
                updateData = cleanObject({
                    name: formData.get('name'),
                    contactNumber: formData.get('contactNumber'),
                    address: formData.get('address'),
                    province: formData.get('province'),
                    district: formData.get('district'),
                    subDistrict: formData.get('subDistrict'),
                    purpose: purpose,
                    ...(purpose === 'other' && otherPurpose.trim() !== '' ? { otherPurpose: otherPurpose } : {})
                });
            }

            if (formData.get('password')) {
                const newPassword = formData.get('password');
                if (newPassword.length < 6) {
                    alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
                    return;
                }
                try {
                    await auth.currentUser.updatePassword(newPassword);
                    console.log("Password updated successfully.");
                } catch (passwordError) {
                    console.error("Error updating password:", passwordError);
                    alert("ไม่สามารถเปลี่ยนรหัสผ่านได้: " + passwordError.message);
                    return;
                }
            }
            
            try {
                await db.collection('users').doc(userId).update(cleanObject(updateData));
                alert('บันทึกข้อมูลสำเร็จ!');
                if (userRole === 'school') {
                    loadSchoolDashboard();
                } else if (userRole === 'farmer') {
                    loadFarmerDashboard();
                }
            } catch (firestoreUpdateError) {
                console.error("Error updating user document:", firestoreUpdateError);
                alert("ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้: " + firestoreUpdateError.message);
            }
        });
    }

    // --- Dashboard specific buttons (always available on dashboards) ---
    attachDashboardListeners();

    // --- F2F Post Button (Farmer Only) ---
    if (document.getElementById('addF2FPostButton')) {
        document.getElementById('addF2FPostButton').addEventListener('click', () => {
            loadContent(getAddF2FPostHtml());
        });
    }
    // --- F2F Post Form Events ---
    if (document.getElementById('backFromAddF2FPost')) {
        document.getElementById('backFromAddF2FPost').addEventListener('click', loadFarmerDashboard);
    }
    if (document.getElementById('addF2FPostForm')) {
        document.getElementById('addF2FPostForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(document.getElementById('addF2FPostForm'));
            const productType = formData.get('productType');
            const price = parseFloat(formData.get('price'));
            const description = formData.get('description');
            const imageFile = formData.get('f2fImage');
            let imageUrl = null;
            try {
                if (imageFile && imageFile.size > 0) {
                    const userId = auth.currentUser ? auth.currentUser.uid : null;
                    const storageRef = storage.ref(`f2f_products/${userId}_${Date.now()}_${imageFile.name}`);
                    const uploadTask = storageRef.put(imageFile);
                    await uploadTask;
                    imageUrl = await storageRef.getDownloadURL();
                }
                const userId = auth.currentUser ? auth.currentUser.uid : null;
                if (!userId) {
                    alert('กรุณาเข้าสู่ระบบก่อนโพสต์ผลิตภัณฑ์');
                    return;
                }
                await db.collection('f2f_products').add({
                    ownerId: userId,
                    productType,
                    price,
                    description,
                    imageUrl,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('โพสต์ผลิตภัณฑ์สำเร็จ!');
                loadFarmerDashboard();
            } catch (error) {
                console.error('Add F2F Product Error:', error);
                alert('บันทึกโพสต์ไม่สำเร็จ: ' + error.message);
            }
        });
    }
}

// Function to attach dashboard-specific listeners
function attachDashboardListeners() {
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

    if (document.getElementById('filterSearchButton')) {
        document.getElementById('filterSearchButton').addEventListener('click', applyFarmerFilters);
    }

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

// --- PAGE LOADING FUNCTIONS ---
// These functions orchestrate which HTML content and data to load.
// They are declared here to ensure all dependencies are met before being called.

function loadLandingPage() {
    resetHeaderTitle();
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userStars');
    localStorage.removeItem('userSubDistrict');
    loadContent(getLandingPageHtml());
}

function loadRoleSelectionPage() {
    resetHeaderTitle();
    loadContent(getRoleSelectionPageHtml());
}

function loadGenericLoginPage() {
    resetHeaderTitle();
    loadContent(getGenericLoginPageHtml());
}

// --- สถิติ Dashboard ---
function getDashboardStatsHtml(stats = { waste: 0, co2: 0 }) {
    return `
    <div class="dashboard-stat-cards">
        <div class="dashboard-stat-card">
            <div class="dashboard-stat-icon">🍃</div>
            <div class="dashboard-stat-value" id="statWasteValue">${stats.waste.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
            <div class="dashboard-stat-label">ขยะที่ลดได้ (kg)</div>
        </div>
        <div class="dashboard-stat-card">
            <div class="dashboard-stat-icon">🌎</div>
            <div class="dashboard-stat-value" id="statCO2Value">${stats.co2.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
            <div class="dashboard-stat-label">ก๊าซเรือนกระจกที่ลดได้ (kgCO₂e)</div>
        </div>
    </div>
    `;
}

// --- คำนวณสถิติ (waste, co2) ---
async function updateDashboardStats() {
    // สมมุติ: 1 kg ขยะอาหาร = 1.9 kgCO2e (ค่าอ้างอิง FAO)
    const CO2_FACTOR = 1.9;
    let totalWaste = 0;
    let totalCO2 = 0;
    try {
        const wasteEntriesSnapshot = await db.collection('wasteentries').where('isDelivered', '==', true).get();
        wasteEntriesSnapshot.forEach(doc => {
            const data = doc.data();
            if (typeof data.weight === 'number') {
                totalWaste += data.weight;
            }
        });
        totalCO2 = totalWaste * CO2_FACTOR;
    } catch (e) {
        console.error('Error calculating dashboard stats:', e);
    }
    // อัปเดตตัวเลขใน DOM
    const wasteEl = document.getElementById('statWasteValue');
    const co2El = document.getElementById('statCO2Value');
    if (wasteEl) wasteEl.textContent = totalWaste.toLocaleString(undefined, {maximumFractionDigits: 2});
    if (co2El) co2El.textContent = totalCO2.toLocaleString(undefined, {maximumFractionDigits: 2});
}

// --- แทรกสถิติไว้ด้านบน Dashboard ---
async function loadSchoolDashboard() {
    resetHeaderTitle();
    loadContent(getSchoolDashboardHtml());
    // แทรกการ์ดสถิติด้านบน
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.insertAdjacentHTML('afterbegin', getDashboardStatsHtml());
        updateDashboardStats();
    }
    // ... (โค้ดเดิมโหลดโพสต์)
    try {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
            alert('กรุณาเข้าสู่ระบบเพื่อดูข้อมูลของคุณ');
            loadLandingPage();
            return;
        }
        const wasteEntriesSnapshot = await db.collection('wasteentries')
                                             .where('schoolId', '==', userId)
                                             .where('isDelivered', '==', false)
                                             .orderBy('postedAt', 'desc')
                                             .get();
        let wasteData = [];
        for (const doc of wasteEntriesSnapshot.docs) {
            const item = { id: doc.id, ...doc.data() };
            if (item.schoolId) {
                const schoolDoc = await db.collection('users').doc(item.schoolId).get();
                if (schoolDoc.exists) {
                    item.schoolInfo = schoolDoc.data();
                }
            }
            wasteData.push(item);
        }
        renderDataBlocks(wasteData, '#schoolDataBlocks');
    }
    catch (error) {
        console.error('Failed to load school dashboard data:', error);
        document.querySelector('#schoolDataBlocks').innerHTML = '<p style="color: red; text-align: center;">ไม่สามารถโหลดข้อมูลได้</p>';
    }
}

function getFarmerDashboardHtml(showProducts = false) {
    console.log('Rendering Farmer Dashboard, showProducts:', showProducts);
    return `
        <div class="farmer-dashboard-container">
            <div class="dashboard-content-area">
                <div class="sidebar">
                    <p class="user-stars">⭐ 0 ดาว</p>
                    <button type="button" class="switch-list-button" id="switchListButton" style="margin-bottom: 18px;">${showProducts ? 'เปลี่ยนไปดูเศษอาหาร' : 'เปลี่ยนไปดูผลิตภัณฑ์'}</button>
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
                        <label for="filterSchoolName">ชื่อโรงเรียน/ร้านอาหาร:</label>
                        <input type="text" id="filterSchoolName" placeholder="เช่น โรงเรียน ABC">
                    </div>
                    <button type="button" class="filter-button" id="filterSearchButton">ค้นหา</button>
                </div>
                <div class="main-display-area">
                    <div class="data-block-wrapper" id="farmerDataBlocks" style="display: ${showProducts ? 'none' : 'flex'};">
                        <p style="text-align: center; color: #666;">กำลังโหลดข้อมูล...</p>
                    </div>
                    <div class="data-block-wrapper" id="f2fProductBlocks" style="display: ${showProducts ? 'flex' : 'none'};">
                        <!-- F2F products will be loaded here -->
                    </div>
                </div>
            </div>

            <div class="dashboard-buttons">
                <button type="button" class="back-button" id="backToMainFromDashboard">ย้อนกลับ</button>
                <button type="button" class="knowledge-button" id="knowledgeButton">ความรู้เรื่องการกำจัดขยะ</button>
                <button type="button" class="received-waste-button-list" id="receivedWasteButton">รายการเศษอาหารที่รับแล้ว</button>
                <button type="button" class="add-f2f-button" id="addF2FPostButton">เพิ่มโพสต์ F2F</button>
            </div>
        </div>
    `;
}

// ปรับโหลด dashboard เกษตรกรให้รองรับโหมดสลับ
async function loadFarmerDashboard(filters = {}, showProducts = false) {
    console.log('loadFarmerDashboard called, showProducts:', showProducts, 'filters:', filters);
    resetHeaderTitle();
    loadContent(getFarmerDashboardHtml(showProducts));
    // แทรกการ์ดสถิติด้านบน
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.insertAdjacentHTML('afterbegin', getDashboardStatsHtml());
        updateDashboardStats();
    }
    if (!showProducts) {
        // โหลดรายการเศษอาหาร
        try {
            const userId = auth.currentUser ? auth.currentUser.uid : null;
            if (!userId) {
                alert('กรุณาเข้าสู่ระบบเพื่อดูข้อมูลของคุณ');
                loadLandingPage();
                return;
            }
            const currentUserSubDistrict = localStorage.getItem('userSubDistrict');
            let allFetchedWasteData = [];
            const allWasteEntriesSnapshot = await db.collection('wasteentries')
                .where('isDelivered', '==', false)
                .orderBy('postedAt', 'desc')
                .get();
            for (const doc of allWasteEntriesSnapshot.docs) {
                const item = { id: doc.id, ...doc.data() };
                if (item.schoolId) {
                    const schoolDoc = await db.collection('users').doc(item.schoolId).get();
                    if (schoolDoc.exists) {
                        item.schoolInfo = schoolDoc.data();
                    }
                }
                allFetchedWasteData.push(item);
            }
            if (currentUserSubDistrict) {
                allFetchedWasteData.sort((a, b) => {
                    const aInSameSubDistrict = a.schoolInfo && a.schoolInfo.subdistrict === currentUserSubDistrict;
                    const bInSameSubDistrict = b.schoolInfo && b.schoolInfo.subdistrict === currentUserSubDistrict;
                    if (aInSameSubDistrict && !bInSameSubDistrict) return -1;
                    if (!aInSameSubDistrict && bInSameSubDistrict) return 1;
                    const timeA = a.postedAt ? a.postedAt.toMillis() : 0;
                    const timeB = b.postedAt ? b.postedAt.toMillis() : 0;
                    return timeB - timeA;
                });
            } else {
                allFetchedWasteData.sort((a, b) => {
                    const timeA = a.postedAt ? a.postedAt.toMillis() : 0;
                    const timeB = b.postedAt ? b.postedAt.toMillis() : 0;
                    return timeB - timeA;
                });
            }
            if (filters.weightMin) {
                allFetchedWasteData = allFetchedWasteData.filter(item => item.weight >= parseFloat(filters.weightMin));
            }
            if (filters.weightMax) {
                allFetchedWasteData = allFetchedWasteData.filter(item => item.weight <= parseFloat(filters.weightMax));
            }
            if (filters.menu) {
                allFetchedWasteData = allFetchedWasteData.filter(item => item.menu.toLowerCase().includes(filters.menu.toLowerCase()));
            }
            if (filters.date) {
                const filterDate = new Date(filters.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
                allFetchedWasteData = allFetchedWasteData.filter(item => {
                    const itemDate = item.date ? new Date(item.date.toDate()).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
                    return itemDate === filterDate;
                });
            }
            if (filters.schoolName) {
                allFetchedWasteData = allFetchedWasteData.filter(item => item.schoolInfo && item.schoolInfo.instituteName.toLowerCase().includes(filters.schoolName.toLowerCase()));
            }
            renderDataBlocks(allFetchedWasteData, '#farmerDataBlocks');
            if (filters.weightMin) document.getElementById('filterWeightMin').value = filters.weightMin;
            if (filters.weightMax) document.getElementById('filterWeightMax').value = filters.weightMax;
            if (filters.menu) document.getElementById('filterMenu').value = filters.menu;
            if (filters.date) document.getElementById('filterDate').value = filters.date;
            if (filters.schoolName) document.getElementById('filterSchoolName').value = filters.schoolName;
        } catch (error) {
            console.error('Failed to load farmer dashboard data:', error);
            document.querySelector('#farmerDataBlocks').innerHTML = '<p style="color: red; text-align: center;">ไม่สามารถโหลดข้อมูลได้</p>';
        }
    } else {
        // โหลดรายการผลิตภัณฑ์
        loadF2FProducts();
    }
    // --- Load F2F Products for Farmers ---
    // loadF2FProducts(); // ย้ายไปโหลดเฉพาะตอน showProducts = true

    // Attach switch button event
    const switchListButton = document.getElementById('switchListButton');
    if (switchListButton) {
        switchListButton.addEventListener('click', () => {
            loadFarmerDashboard({}, !showProducts);
        });
    } else {
        console.warn('switchListButton NOT FOUND in sidebar!');
    }
    // Attach filter event (เฉพาะโหมดเศษอาหาร)
    if (!showProducts && document.getElementById('filterSearchButton')) {
        document.getElementById('filterSearchButton').addEventListener('click', applyFarmerFilters);
    }
}

// ปรับ applyFarmerFilters ให้รองรับโหมด
async function applyFarmerFilters() {
    const filters = {
        weightMin: document.getElementById('filterWeightMin').value,
        weightMax: document.getElementById('filterWeightMax').value,
        menu: document.getElementById('filterMenu').value,
        date: document.getElementById('filterDate').value,
        schoolName: document.getElementById('filterSchoolName').value
    };
    await loadFarmerDashboard(filters, false);
}

async function loadPostDetails(postId) {
    resetHeaderTitle();
    loadContent(getPostDetailsHtml());
    try {
        const wasteEntryDoc = await db.collection('wasteentries').doc(postId).get();
        if (!wasteEntryDoc.exists) {
            alert('ไม่พบข้อมูลเศษอาหาร');
            loadFarmerDashboard();
            return;
        }
        const postData = { id: wasteEntryDoc.id, ...wasteEntryDoc.data() };

        if (postData.schoolId) {
            const schoolDoc = await db.collection('users').doc(postData.schoolId).get();
            if (schoolDoc.exists) {
                postData.schoolInfo = schoolDoc.data();
            }
        }
        if (postData.isReceived && postData.receivedBy) {
            const farmerDoc = await db.collection('users').doc(postData.receivedBy).get();
            if (farmerDoc.exists) {
                postData.receivedByInfo = farmerDoc.data();
            }
        }

        loadContent(getPostDetailsHtml(postData));
    } catch (error) {
        console.error('Failed to load post details:', error);
        alert('ไม่สามารถโหลดข้อมูลรายละเอียดได้: ' + error.message);
        loadFarmerDashboard();
    }
}

async function loadAnalysisPage() {
    loadContent(getAnalysisPageHtml());
    const headerH1 = document.querySelector('.hero-section h1');
    if (headerH1) headerH1.textContent = 'รายงานวิเคราะห์เศษอาหาร (7 วันล่าสุด)';

    try {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
            alert('กรุณาเข้าสู่ระบบเพื่อดูรายงานวิเคราะห์');
            loadLandingPage();
            return;
        }

        // 1. เตรียมข้อมูล 7 วันล่าสุด
        const today = new Date();
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setHours(0,0,0,0);
            d.setDate(today.getDate() - i);
            last7Days.push(d);
        }
        const labels = last7Days.map(d => d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }));
        const wastePerDay = Array(7).fill(0);

        // 2. ดึงข้อมูล wasteentries ที่ isDelivered = true
        const snapshot = await db.collection('wasteentries')
            .where('isDelivered', '==', true)
            .get();

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.date && typeof data.weight === 'number') {
                const entryDate = data.date.toDate();
                entryDate.setHours(0,0,0,0);
                for (let i = 0; i < 7; i++) {
                    if (entryDate.getTime() === last7Days[i].getTime()) {
                        wastePerDay[i] += data.weight;
                    }
                }
            }
        });

        // DEBUG: ดูข้อมูลที่ได้
        console.log('labels', labels);
        console.log('wastePerDay', wastePerDay);

        // 3. ปรับขนาด canvas
        const wasteChartCanvas = document.getElementById('wasteChart');
        wasteChartCanvas.width = 700;
        wasteChartCanvas.height = 400;

        // 4. สร้างกราฟ Chart.js
        const ctx = wasteChartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'ขยะที่ลดได้ (kg)',
                    data: wastePerDay,
                    backgroundColor: '#28a745',
                    borderRadius: 12,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

    } catch (error) {
        console.error('Failed to load analysis data:', error);
        document.querySelector('.chart-container').innerHTML = '<p style="color: red; text-align: center;">ไม่สามารถโหลดข้อมูลวิเคราะห์ได้</p>';
    }
}

// ฟังก์ชันช่วยเปลี่ยน header กลับเป็น PHUKET FOOD HERO เมื่อออกจากหน้า "วิเคราะห์"
function resetHeaderTitle() {
    const headerH1 = document.querySelector('.hero-section h1');
    if (headerH1) headerH1.textContent = 'PHUKET FOOD HERO';
}

async function loadEditProfilePage() {
    resetHeaderTitle();
    loadContent(getEditProfilePageHtml());
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) {
        alert('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
        loadLandingPage();
        return;
    }
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            alert('ไม่พบข้อมูลผู้ใช้');
            loadLandingPage();
            return;
        }
        const userData = userDoc.data();
        document.getElementById('editEmail').value = userData.email || '';
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'school') {
            if (document.getElementById('editInstituteName')) document.getElementById('editInstituteName').value = userData.instituteName || '';
            if (document.getElementById('editContactNumber')) document.getElementById('editContactNumber').value = userData.contactNumber || '';
            populateProvinces('editProvinceSelect', userData.province);
            if (userData.province) {
                const districtSelect = document.getElementById('editDistrictSelect');
                const subdistrictSelect = document.getElementById('editSubdistrictSelect');
                if (districtSelect) districtSelect.dataset.preselected = userData.district || '';
                if (subdistrictSelect) subdistrictSelect.dataset.preselected = userData.subdistrict || '';
                await populateDistricts('editProvinceSelect', 'editDistrictSelect', 'editSubdistrictSelect', userData.district);
                if (userData.district) {
                    await populateSubdistricts('editDistrictSelect', 'editSubdistrictSelect', userData.subdistrict);
                }
            }
        } else if (userRole === 'farmer') {
            if (document.getElementById('editFarmerName')) document.getElementById('editFarmerName').value = userData.name || '';
            if (document.getElementById('editFarmerContactNumber')) document.getElementById('editFarmerContactNumber').value = userData.contactNumber || '';
            if (document.getElementById('editFarmerAddress')) document.getElementById('editFarmerAddress').value = userData.address || '';
            const farmerProvinceSelect = document.getElementById('editFarmerProvince');
            if (farmerProvinceSelect) {
                farmerProvinceSelect.value = userData.province || '';
                if (userData.province) {
                    const farmerDistrictSelect = document.getElementById('editFarmerDistrict');
                    const farmerSubDistrictSelect = document.getElementById('editFarmerSubDistrict');
                    if (farmerDistrictSelect) farmerDistrictSelect.dataset.preselected = userData.district || '';
                    if (farmerSubDistrictSelect) farmerSubDistrictSelect.dataset.preselected = userData.subDistrict || '';
                    await populateDistricts('editFarmerProvince', 'editFarmerDistrict', 'editFarmerSubDistrict', userData.district);
                    if (userData.district) {
                        await populateSubdistricts('editFarmerDistrict', 'editFarmerSubDistrict', userData.subDistrict);
                    }
                }
            }
            const purposeSelect = document.getElementById('editPurposeSelect');
            if (purposeSelect) {
                purposeSelect.value = userData.purpose || '';
                const editOtherPurposeInput = document.getElementById('editOtherPurposeInput');
                if (editOtherPurposeInput) {
                    editOtherPurposeInput.style.display = (userData.purpose === 'other' ? 'block' : 'none');
                    document.getElementById('editOtherPurpose').value = userData.otherPurpose || '';
                }
            }
        }
        if (document.getElementById('editPurposeSelect')) {
            document.getElementById('editPurposeSelect').addEventListener('change', toggleEditOtherPurposeInput);
        }
    } catch (error) {
        console.error('Failed to load profile data:', error);
        alert('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้: ' + error.message);
    }
}

function loadKnowledgePage() {
    loadContent(getKnowledgePageHtml());
    // เปลี่ยน header เฉพาะหน้านี้
    const headerH1 = document.querySelector('.hero-section h1');
    if (headerH1) headerH1.textContent = 'ความรู้เรื่องการกำจัดขยะและเศษอาหาร';
    // เมื่อกดปุ่มย้อนกลับ ให้เปลี่ยน header กลับ
    const backBtn = document.getElementById('backFromKnowledge');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const headerH1 = document.querySelector('.hero-section h1');
            if (headerH1) headerH1.textContent = 'PHUKET FOOD HERO';
        });
    }
}

async function loadPendingDeliveryPage() {
    loadContent(getPendingDeliveryHtml());
    try {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
            alert('กรุณาเข้าสู่ระบบเพื่อดูรายการนี้');
            loadLandingPage();
            return;
        }
        const pendingEntriesSnapshot = await db.collection('wasteentries')
                                               .where('schoolId', '==', userId)
                                               .where('isReceived', '==', true)
                                               .where('isDelivered', '==', false)
                                               .orderBy('receivedAt', 'desc')
                                               .get();
        let pendingData = [];
        for (const doc of pendingEntriesSnapshot.docs) {
            const item = { id: doc.id, ...doc.data() };
            if (item.receivedBy) {
                const farmerDoc = await db.collection('users').doc(item.receivedBy).get();
                if (farmerDoc.exists) {
                    item.receivedByInfo = farmerDoc.data();
                }
            }
            pendingData.push(item);
        }
        renderDataBlocks(pendingData, '#pendingDeliveryBlocks');
    } catch (error) {
        console.error('Failed to load pending delivery data:', error);
        document.querySelector('#pendingDeliveryBlocks').innerHTML = '<p style="color: red; text-align: center;">ไม่สามารถโหลดข้อมูลรายการที่ต้องส่งได้</p>';
    }
}

async function loadReceivedWastePage() {
    loadContent(getReceivedWasteHtml());
    try {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
            alert('กรุณาเข้าสู่ระบบเพื่อดูรายการนี้');
            loadLandingPage();
            return;
        }
        const receivedEntriesSnapshot = await db.collection('wasteentries')
                                                .where('receivedBy', '==', userId)
                                                .where('isReceived', '==', true)
                                                .orderBy('receivedAt', 'desc')
                                                .get();
        let receivedData = [];
        for (const doc of receivedEntriesSnapshot.docs) {
            const item = { id: doc.id, ...doc.data() };
            if (item.schoolId) {
                const schoolDoc = await db.collection('users').doc(item.schoolId).get();
                if (schoolDoc.exists) {
                    item.schoolInfo = schoolDoc.data();
                }
            }
            receivedData.push(item);
        }
        renderDataBlocks(receivedData, '#receivedWasteBlocks');
    } catch (error) {
        console.error('Failed to load received waste data:', error);
        document.querySelector('#receivedWasteBlocks').innerHTML = '<p style="color: red; text-align: center;">ไม่สามารถโหลดข้อมูลรายการที่รับแล้วได้</p>';
    }
}

function loadQRCodeDisplayPage(wasteId) {
    loadContent(getQRCodeDisplayHtml(wasteId));
}


// --- HTML CONTENT FUNCTIONS ---
// (These functions return HTML strings and are called by the page loading functions)
function getLandingPageHtml() {
    return `
        <div class="main-page-container landing-page">
            <section class="about-section">
                <h2>เกี่ยวกับ "ภูเก็ตฟู้ดฮีโร่"</h2>
                <div class="about-content">
                    <img src="images/pui.jpg" alt="คนกำลังทำปุ๋ยหมัก" class="about-image">
                    <div class="about-text">
                        <p>ภารกิจของเราคือเปลี่ยนขยะเศษอาหารให้เป็นพลังงานชีวิต!</p>
                        <p><strong>"เชื่อมโยงผู้ส่งถึงผู้รับ":</strong> แพลตฟอร์มแรกที่ผสานโรงเรียน ร้านอาหาร และเกษตรกรเข้าด้วยกัน เพื่ออนาคตสีเขียวของภูเก็ต</p>
                        <p><strong>"ทุกเศษอาหารมีโอกาส":</strong> ลดการฝังกลบ ลดมลพิษ เปลี่ยนเศษอาหารเป็นปุ๋ยบำรุงดิน เพิ่มผลผลิตเกษตร</p>
                        <p><strong>"ผู้ใช้ที่แท้จริงคือคุณ":</strong> ร่วมบันทึก วิเคราะห์ และแบ่งปันเศษอาหาร สร้างผลกระทบเชิงบวกที่ยั่งยืน</p>
                        <p><strong>"รับรองด้วย "ดาวแห่งความดี":</strong> ยิ่งร่วมมือมาก ยิ่งได้รับดาวมาก ยิ่งเป็นที่ยอมรับในฐานะผู้ขับเคลื่อนความเปลี่ยนแปลง!</p>
                        <p>ที่ "ภูเก็ตฟู้ดฮีโร่" เราไม่ได้เพียงแค่เคลม...แต่เราสร้างคุณค่าให้แก่ชุมชนและสิ่งแวดล้อม!</p>
                    </div>
                </div>
            </section>

            <section class="how-it-works-section">
                <h2>แพลตฟอร์มทำงานอย่างไร?</h2>
                <div class="how-it-works-cards">
                    <div class="how-it-works-card">
                        <div class="icon-circle primary-green"><h3>1</h3></div>
                        <img src="images/post.png" alt="ไอคอนโพสต์" class="how-it-works-icon">
                        <h4>ผู้ให้ (โรงเรียน/ร้านอาหาร)</h4>
                        <p>ลงทะเบียนและเข้าสู่ระบบ อัปเดตรายการเศษอาหารจากโรงเรียน/ร้านอาหารเป็นรายวัน เพื่อโพสต์ประกาศให้เกษตรกรที่ต้องการรับต่อได้ก่อนใคร</p>
                    </div>
                    <div class="how-it-works-card">
                        <div class="icon-circle primary-blue"><h3>2</h3></div>
                        <img src="images/search.png" alt="ไอคอนค้นหา" class="how-it-works-icon">
                        <h4>เกษตรกร</h4>
                        <p>ลงทะเบียนและเข้าสู่ระบบ ค้นหารายการเศษอาหารจากโรงเรียน/ร้านอาหารที่เปิดรับ ดูรายละเอียดและติดต่อเพื่อขอรับไปใช้ประโยชน์</p>
                    </div>
                    <div class="how-it-works-card">
                        <div class="icon-circle primary-yellow"><h3>3</h3></div>
                        <img src="images/star.png" alt="ไอคอนดาว" class="how-it-works-icon">
                        <h4>ลดขยะ & รับดาวเขียว</h4>
                        <p>ร่วมกันลดปริมาณขยะอาหารโรงเรียน/ร้านอาหารให้มีประสิทธิภาพอย่างต่อเนื่อง และมีประสิทธิภาพ ทำให้ "ดาวแห่งภูเก็ต" เป็นการให้ของ</p>
                    </div>
                </div>
            </section>

            <section class="knowledge-base-section">
                <h2>คลังความรู้ลดขยะอาหาร</h2>
                <div class="knowledge-cards-wrapper">
                    <div class="knowledge-card">
                        <img src="images/refrigerator.jpg" alt="ตู้เย็น" class="knowledge-card-image">
                        <h3>5 เทคนิคจัดการสต็อก ลดอาหารเหลือทิ้งในร้าน</h3>
                        <p>เรียนรู้วิธีการจัดเก็บ และหมุนเวียนวัตถุดิบอย่างมีประสิทธิภาพเพื่อลดการเหลือทิ้ง</p>
                        <a href="#" class="read-more-button">อ่านเพิ่มเติม -</a>
                    </div>
                    <div class="knowledge-card">
                        <img src="images/compost.jpg" alt="การหมักปุ๋ย" class="knowledge-card-image">
                        <h3>เปลี่ยนเศษผักเปลือกผลไม้เป็นปุ๋ยหมักง่ายๆ ที่โรงเรียน/ร้านอาหาร</h3>
                        <p>แนะนำขั้นตอนการทำปุ๋ยหมักจากเศษอาหารอินทรีย์ในโรงเรียนหรือร้านอาหาร เพื่อสร้างพื้นที่สีเขียวสะอาด</p>
                        <a href="#" class="read-more-button">อ่านเพิ่มเติม -</a>
                    </div>
                    <div class="knowledge-card">
                        <img src="images/food_hero_hierarchy.jpg" alt="Food Recovery Hierarchy" class="knowledge-card-image">
                        <h3>เข้าใจ Food Recovery Hierarchy ลดขยะอย่างถูกวิธี</h3>
                        <p>รู้จักลำดับความสำคัญในการจัดการขยะอาหาร ตั้งแต่การลดที่แหล่งกำเนิดจนถึงการกำจัด</p>
                        <a href="#" class="read-more-button">อ่านเพิ่มเติม -</a>
                    </div>
                </div>
            </section>

            <div class="main-page-button-wrapper">
                <button class="button" id="goToRoleSelection">ต่อไป</button>
            </div>
        </div>
    `;
}

function getRoleSelectionPageHtml() {
    return `
        <div class="main-page-container">
            <h2 class="main-question-text">คุณคือใครในโครงการ PHUKET FOOD HERO นี้</h2>
            <div class="cards-and-descriptions-wrapper">
                <div class="card-with-description">
                    <div class="card">
                        <img src="images/school.png" alt="รูปภาพผู้ให้" class="card-image">
                        <button class="button" id="schoolButton">ผู้ให้</button>
                    </div>
                    <p class="card-description-text">คลิกที่นี่เพื่อลงทะเบียนและจัดการเศษอาหารเหลือจากโรงเรียน/ร้านอาหารของคุณ</p>
                </div>
                <div class="card-with-description">
                    <div class="card">
                        <img src="images/farmer.jpg" alt="รูปภาพเกษตรกร" class="card-image">
                        <button class="button" id="farmerButton">เกษตรกร</button>
                    </div>
                    <p class="card-description-text">คลิกที่นี่เพื่อเลือกประเภทเศษอาหารที่คุณต้องการนำไปใช้ประโยชน์</p>
                </div>
            </div>
        </div>
    `;
}

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
            <h2>Login สำหรับผู้ให้</h2>
            <form id="schoolLoginForm">
                <div class="form-group">
                    <label for="instituteName">ชื่อสถาบัน/ร้านอาหาร</label>
                    <input type="text" id="instituteName" name="instituteName" required>
                </div>
                <div class="form-group">
                    <label for="provinceSelect">จังหวัด</label>
                    <select id="provinceSelect" name="province" required>
                        <option value="">-- เลือกจังหวัด --</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="districtSelect">อำเภอ</label>
                    <select id="districtSelect" name="district" required disabled>
                        <option value="">-- เลือกอำเภอ --</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="subdistrictSelect">ตำบล</label>
                    <select id="subdistrictSelect" name="subdistrict" required disabled>
                        <option value="">-- เลือกตำบล --</option>
                    </select>
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
                    <label for="farmerAddress">ที่อยู่ (บ้านเลขที่, ถนน, ซอย)</label>
                    <input type="text" id="farmerAddress" name="address" required>
                </div>
                <div class="form-group">
                    <label for="farmerProvince">จังหวัด</label>
                    <select id="farmerProvince" name="province" required>
                        <option value="">-- เลือกจังหวัด --</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="farmerDistrict">อำเภอ/เขต</label>
                    <select id="farmerDistrict" name="district" required disabled>
                        <option value="">-- เลือกอำเภอ/เขต --</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="farmerSubDistrict">ตำบล/แขวง</label>
                    <select id="farmerSubDistrict" name="subDistrict" required disabled>
                        <option value="">-- เลือกตำบล/แขวง --</option>
                    </select>
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
                <div class="form-group" id="otherPurposeInput" style="display:none;">
                    <label for="otherPurpose">ระบุความต้องการอื่นๆ</label>
                    <textarea id="otherPurpose" name="otherPurpose" rows="3"></textarea>
                </div>
                <button type="submit" class="login-button">Login</button>
                <button type="button" class="back-button" id="backToMain">ย้อนกลับ</button>
            </form>
        </div>
    `;
}

function getSchoolDashboardHtml() {
    return `
        <div class="school-dashboard-container">
            <div class="dashboard-content-area">
                <div class="sidebar">
                    <p class="user-stars">⭐ 0 ดาว</p>
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
                        <p style="text-align: center; color: #666;">กำลังโหลดข้อมูล...</p>
                    </div>
                    <div class="data-block-wrapper" id="f2fProductBlocks">
                        <!-- F2F products will be loaded here -->
                    </div>
                </div>
            </div>

            <div class="dashboard-buttons">
                <button type="button" class="back-button" id="backToMainFromDashboard">ย้อนกลับ</button>
                <button type="button" class="knowledge-button" id="knowledgeButton">ความรู้เรื่องการกำจัดขยะ</button>
                <button type="button" class="received-waste-button-list" id="receivedWasteButton">รายการเศษอาหารที่รับแล้ว</button>
                <button type="button" class="add-f2f-button" id="addF2FPostButton">เพิ่มโพสต์ F2F</button>
            </div>
        </div>
    `;
}

// --- NEW: F2F Post Form ---
function getAddF2FPostHtml() {
    return `
        <div class="add-waste-container">
            <h2>เพิ่มโพสต์ผลิตภัณฑ์เกษตรกร (F2F)</h2>
            <form id="addF2FPostForm">
                <div class="form-row">
                    <div class="form-group upload-group">
                        <label for="f2fImage" class="upload-button-label">อัพโหลดรูปภาพผลิตภัณฑ์</label>
                        <input type="file" id="f2fImage" name="f2fImage" accept="image/*" class="hidden-input">
                        <img id="f2fImagePreview" src="#" alt="Image Preview" style="display:none;">
                    </div>
                    <div class="form-fields-group">
                        <div class="form-group">
                            <label for="f2fProductType">ประเภทผลิตภัณฑ์</label>
                            <select id="f2fProductType" name="productType" required>
                                <option value="">-- เลือกประเภท --</option>
                                <option value="animal_feed">อาหารสัตว์</option>
                                <option value="bio_compost">ปุ๋ยหมักชีวภาพ</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="f2fPrice">ราคา (บาท)</label>
                            <input type="number" id="f2fPrice" name="price" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label for="f2fDescription">รายละเอียดเพิ่มเติม</label>
                            <textarea id="f2fDescription" name="description" rows="3"></textarea>
                        </div>
                    </div>
                </div>
                <div class="form-buttons">
                    <button type="button" class="back-button" id="backFromAddF2FPost">ย้อนกลับ</button>
                    <button type="submit" class="login-button">โพสต์</button>
                </div>
            </form>
        </div>
    `;
}

function getPostDetailsHtml(postData) {
    if (!postData) {
        return `<div class="post-details-container"><p style="color: #666; text-align: center;">ไม่พบข้อมูลรายละเอียด</p><div class="form-buttons"><button type="button" class="back-button" id="backFromPostDetails">ย้อนกลับ</button></div></div>`;
    }

    const date = new Date(postData.date.toDate()).toLocaleDateString('th-TH', {
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
                    <p><strong>โรงเรียน/ร้านอาหาร:</strong> ${postData.schoolInfo ? postData.schoolInfo.instituteName : 'ไม่ระบุโรงเรียน/ร้านอาหาร'}</p>
                    <p><strong>อีเมล:</strong> ${postData.schoolInfo ? postData.schoolInfo.email : 'ไม่ระบุ'}</p>
                    <p><strong>ที่อยู่:</strong> ${postData.schoolInfo ? `${postData.schoolInfo.subdistrict}, ${postData.schoolInfo.district}, ${postData.schoolInfo.province}` : 'ไม่ระบุ'}</p>
                    <p><strong>เบอร์ติดต่อ:</strong> ${postData.schoolInfo ? postData.schoolInfo.contactNumber : 'ไม่ระบุ'}</p>
                </div>
            </div>
            <div class="form-buttons">
                <button type="button" class="back-button" id="backFromPostDetails">ย้อนกลับ</button>
            </div>
        </div>
    `;
}

function getAnalysisPageHtml() {
    return `
        <div class="analysis-container">
            <div class="chart-container">
                <canvas id="wasteChart"></canvas>
            </div>
            <div class="form-buttons">
                <button type="button" class="back-button" id="backFromAnalysis">ย้อนกลับ</button>
            </div>
        </div>
    `;
}

function getEditProfilePageHtml(userData = {}) {
    const userRole = localStorage.getItem('userRole');
    const instituteName = userData.instituteName || '';
    const schoolProvince = userData.province || '';
    const schoolDistrict = userData.district || '';
    const schoolSubdistrict = userData.subdistrict || '';
    const schoolContactNumber = userData.contactNumber || '';
    const farmerName = userData.name || '';
    const farmerContactNumber = userData.contactNumber || '';
    const farmerAddress = userData.address || '';
    const farmerProvince = userData.province || '';
    const farmerDistrict = userData.district || '';
    const farmerSubDistrict = userData.subDistrict || '';
    const purpose = userData.purpose || '';
    const otherPurpose = userData.otherPurpose || '';
    const email = userData.email || '';

    let roleSpecificFields = '';
    if (userRole === 'school') {
        roleSpecificFields = `
            <div class="form-group">
                <label for="editInstituteName">ชื่อสถาบัน/ร้านอาหาร</label>
                <input type="text" id="editInstituteName" name="instituteName" value="${instituteName}" required>
            </div>
            <div class="form-group">
                <label for="editProvinceSelect">จังหวัด</label>
                <select id="editProvinceSelect" name="province" required>
                    <option value="">-- เลือกจังหวัด --</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editDistrictSelect">อำเภอ</label>
                <select id="editDistrictSelect" name="district" required disabled>
                        <option value="">-- เลือกอำเภอ --</option>
                    </select>
            </div>
            <div class="form-group">
                <label for="editSubdistrictSelect">ตำบล</label>
                <select id="editSubdistrictSelect" name="subdistrict" required disabled>
                        <option value="">-- เลือกตำบล --</option>
                    </select>
            </div>
            <div class="form-group">
                <label for="editContactNumber">เบอร์ติดต่อ</label>
                <input type="tel" id="editContactNumber" name="contactNumber" value="${schoolContactNumber}" required>
            </div>
        `;
    } else if (userRole === 'farmer') {
         roleSpecificFields = `
            <div class="form-group">
                <label for="editFarmerName">ชื่อ</label>
                <input type="text" id="editFarmerName" name="name" value="${farmerName}" required>
            </div>
            <div class="form-group">
                <label for="editFarmerContactNumber">เบอร์ติดต่อ</label>
                <input type="tel" id="editFarmerContactNumber" name="contactNumber" value="${farmerContactNumber}" required>
            </div>
            <div class="form-group">
                <label for="editFarmerAddress">ที่อยู่ (บ้านเลขที่, ถนน, ซอย)</label>
                <input type="text" id="editFarmerAddress" name="address" value="${farmerAddress}" required>
            </div>
            <div class="form-group">
                <label for="editFarmerProvince">จังหวัด</label>
                <select id="editFarmerProvince" name="province" required>
                    <option value="">-- เลือกจังหวัด --</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editFarmerDistrict">อำเภอ/เขต</label>
                <select id="editFarmerDistrict" name="district" required disabled>
                        <option value="">-- เลือกอำเภอ/เขต --</option>
                    </select>
            </div>
            <div class="form-group">
                <label for="editFarmerSubDistrict">ตำบล/แขวง</label>
                <select id="editFarmerSubDistrict" name="subDistrict" required disabled>
                        <option value="">-- เลือกตำบล/แขวง --</option>
                    </select>
            </div>
            <div class="form-group">
                <label for="editPurposeSelect">ความต้องการของคุณ</label>
                <select id="editPurposeSelect" name="purpose" required>
                    <option value="animal_feed" ${purpose === 'animal_feed' ? 'selected' : ''}>อยากนำเศษอาหารไปเลี้ยงสัตว์</option>
                    <option value="compost" ${purpose === 'compost' ? 'selected' : ''}>อยากนำเศษอาหารไปหมักทำปุ๋ย</option>
                    <option value="other" ${purpose === 'other' ? 'selected' : ''}>อื่นๆ</option>
                </select>
            </div>
            <div class="form-group" id="editOtherPurposeInput" style="${purpose === 'other' ? 'display:block;' : 'display:none;' }">
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
                    <li><strong>แยกตั้งแต่ต้นทาง:</strong> แบ่งถังขยะสำหรับเศษอาหารโดยเฉพาะในครัวเรือน โรงเรียน หรือร้านอาหาร</li>
                    <li><strong>เทน้ำออก::</strong> ก่อนทิ้งเศษอาหาร ควรเทน้ำหรือของเหลวส่วนเกินออกให้มากที่สุด เพื่อลดน้ำหนักและกลิ่น</li>
                    <li><strong>ใส่ภาชนะที่เหมาะสม:</strong> ใช้ถุงหรือภาชนะที่ปิดสนิทเพื่อป้องกันกลิ่นและสัตว์รบกวน</li>
                    <li><strong>นำไปใช้ประโยชน์:</strong> หากเป็นไปได้ ลองนำเศษอาหารไปทำปุ๋ยหมักเองที่บ้าน หรือหาแหล่งรับซื้อ/รับบริจาคเศษอาหารในชุมชน</li>
                </ol>
            </div>
            <div class="form-buttons">
                <button type="button" class="back-button" id="backFromKnowledge">ย้อนกลับ</button>
            </div>
        </div>
    `;
}

function getPendingDeliveryHtml(pendingItems = []) {
    let pendingBlocksHtml = '';
    if (pendingItems.length === 0) {
        pendingBlocksHtml = '<p style="color: #666; text-align: center; margin-top: 30px;">ไม่มีรายการเศษอาหารที่ต้องส่ง</p>';
    } else {
        pendingItems.forEach(item => {
            const date = new Date(item.date.toDate()).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            const receivedAt = item.receivedAt ? new Date(item.receivedAt.toDate()).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ';
            pendingBlocksHtml += `
                <div class="data-block pending-item">
                    <img src="${item.imageUrl || 'https://placehold.co/100x80/ADD8E6/000000?text=Waste+Pic'}" alt="Waste Image" class="data-item-image">
                    <div class="data-item-details">
                        <p><strong>เมนู:</strong> ${item.menu}</p>
                        <p><strong>ปริมาณ:</strong> ${item.weight} kg</p>
                        <p><strong>วันที่โพสต์:</strong> ${date}</p>
                        <p><strong>ผู้รับ (เกษตรกร):</strong> ${item.receivedByInfo ? item.receivedByInfo.name : 'ไม่ระบุ'}</p>
                        <p><strong>ติดต่อผู้รับ:</strong> ${item.receivedByInfo ? item.receivedByInfo.contactNumber : 'ไม่ระบุ'}</p>
                        <p><strong>รับแล้วเมื่อ:</strong> ${receivedAt}</p>
                    </div>
                    <button class="scan-qr-button" data-id="${item.id}">สแกน QR Code เพื่อยืนยัน</button>
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

function getReceivedWasteHtml(receivedItems = []) {
    let receivedBlocksHtml = '';
    if (receivedItems.length === 0) {
        receivedBlocksHtml = '<p style="color: #666; text-align: center; margin-top: 30px;">ยังไม่มีรายการเศษอาหารที่รับ</p>';
    } else {
        receivedItems.forEach(item => {
            const date = new Date(item.date.toDate()).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
            const receivedAt = item.receivedAt ? new Date(item.receivedAt.toDate()).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ';
            const deliveredStatus = item.isDelivered ? 'ส่งมอบแล้ว' : 'รอส่งมอบ';
            receivedBlocksHtml += `
                <div class="data-block received-item">
                    <img src="${item.imageUrl || 'https://placehold.co/100x80/ADD8E6/000000?text=Waste+Pic'}" alt="Waste Image" class="data-item-image">
                    <div class="data-item-details">
                        <p><strong>เมนู:</strong> ${item.menu}</p>
                        <p><strong>ปริมาณ:</strong> ${item.weight} kg</p>
                        <p><strong>วันที่โพสต์:</strong> ${date}</p>
                        <p><strong>จากโรงเรียน/ร้านอาหาร:</strong> ${item.schoolInfo ? item.schoolInfo.instituteName : 'ไม่ระบุโรงเรียน/ร้านอาหาร'}</p>
                        <p><strong>รับแล้วเมื่อ:</strong> ${receivedAt}</p>
                        <p><strong>สถานะส่งมอบ:</strong> <span class="${item.isDelivered ? 'status-delivered' : 'status-pending'}">${deliveredStatus}</span></p>
                    </div>
                    ${!item.isDelivered ? `
                        <button class="show-qr-button" data-id="${item.id}">แสดง QR Code</button>
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

function getQRCodeDisplayHtml(wasteId) {
    return `
        <div class="qr-code-container">
            <h2>แสดง QR Code</h2>
            <p>กรุณาให้ผู้ให้ (โรงเรียน/ร้านอาหาร) สแกน QR Code นี้เพื่อยืนยันการรับเศษอาหาร</p>
            <div class="qr-code-box">
                <p class="qr-code-text">Waste ID: ${wasteId}</p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wasteId}" alt="QR Code for Waste ID">
            </div>
            <div class="form-buttons">
                <button type="button" class="back-button" id="backFromQRScan">ย้อนกลับ</button>
            </div>
        </div>
    `;
}


// Initial page load and setup
document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) {
        console.error("Error: #app-container not found. Check index.html.");
        return;
    }

    const signInLink = document.getElementById('signInLink');
    if (signInLink) {
        signInLink.addEventListener('click', (event) => {
            event.preventDefault();
            loadGenericLoginPage();
        });
    } else {
        console.warn("Warning: #signInLink not found. The sign-in button may not be functional.");
    }

    // Use onAuthStateChanged to determine which page to load initially
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const userRole = doc.data().role;
                        localStorage.setItem('userRole', userRole);
                        localStorage.setItem('userId', user.uid);
                        localStorage.setItem('userStars', doc.data().stars || 0);
                        if (userRole === 'farmer' && doc.data().subDistrict) {
                            localStorage.setItem('userSubDistrict', doc.data().subDistrict);
                        }
                        if (userRole === 'school') {
                            loadSchoolDashboard();
                        } else if (userRole === 'farmer') {
                            loadFarmerDashboard();
                        } else {
                            loadLandingPage();
                        }
                    } else {
                        console.error("User document not found for logged in user:", user.uid);
                        auth.signOut();
                        loadLandingPage();
                    }
                })
                .catch(error => {
                    console.error("Error fetching user role:", error);
                    alert("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้: " + error.message);
                    auth.signOut();
                    loadLandingPage();
                });
        } else {
            loadLandingPage();
        }
    });
});

// --- NEW: Load and Render F2F Products for Farmers ---
async function loadF2FProducts() {
    const wrapper = document.getElementById('f2fProductBlocks');
    if (!wrapper) return;
    wrapper.innerHTML = '<p style="text-align: center; color: #555;">กำลังโหลดโพสต์ผลิตภัณฑ์...</p>';
    try {
        const snapshot = await db.collection('f2f_products').orderBy('createdAt', 'desc').get();
        let html = '';
        if (snapshot.empty) {
            html = '<p style="color: #666; text-align: center; margin-top: 30px;">ยังไม่มีโพสต์ผลิตภัณฑ์จากเกษตรกร</p>';
        } else {
            const userId = auth.currentUser ? auth.currentUser.uid : null;
            snapshot.forEach(doc => {
                const item = doc.data();
                html += `
                    <div class="data-block f2f-product-item">
                        <img src="${item.imageUrl || 'https://placehold.co/100x80/ADD8E6/000000?text=Product'}" alt="Product Image" class="data-item-image">
                        <div class="data-item-details">
                            <p><strong>ประเภท:</strong> ${item.productType === 'animal_feed' ? 'อาหารสัตว์' : 'ปุ๋ยหมักชีวภาพ'}</p>
                            <p><strong>ราคา:</strong> ${item.price} บาท</p>
                            <p><strong>รายละเอียด:</strong> ${item.description || '-'} </p>
                        </div>
                        ${(userId && item.ownerId === userId) ? `<button class='delete-f2f-button' data-id='${doc.id}'>ลบ</button>` : ''}
                    </div>
                `;
            });
        }
        wrapper.innerHTML = html;
        // Attach delete event for F2F products
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (userId) {
            wrapper.querySelectorAll('.delete-f2f-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productId = e.target.dataset.id;
                    showConfirmationModal('คุณแน่ใจหรือไม่ที่จะลบโพสต์ผลิตภัณฑ์นี้?', () => deleteF2FProduct(productId));
                });
            });
        }
    } catch (error) {
        console.error('Load F2F Products Error:', error);
        wrapper.innerHTML = '<p style="color: red; text-align: center;">ไม่สามารถโหลดโพสต์ผลิตภัณฑ์ได้</p>';
    }
}

// เรียกใช้ loadF2FProducts() หลังโหลด Dashboard เกษตรกร

function getUserBadge(stars) {
    if (stars >= 30) return { badge: 'Gold', icon: '🥇' };
    if (stars >= 20) return { badge: 'Silver', icon: '🥈' };
    if (stars >= 10) return { badge: 'Bronze', icon: '🥉' };
    return { badge: 'Starter', icon: '⭐' };
}

// ใน renderDataBlocks หรือ Sidebar
const badge = getUserBadge(userStars);
document.querySelector('.user-stars').innerHTML = `⭐ ${userStars} ดาว <br> Badge: ${badge.icon} ${badge.badge}`;

// เพิ่มฟังก์ชันลบสำหรับเกษตรกร
async function deleteWasteEntryForFarmer(id) {
    try {
        const wasteEntryRef = db.collection('wasteentries').doc(id);
        const wasteEntryDoc = await wasteEntryRef.get();
        if (!wasteEntryDoc.exists) {
            alert('ไม่พบข้อมูลเศษอาหารที่จะลบ');
            return;
        }
        const wasteEntryData = wasteEntryDoc.data();
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId || wasteEntryData.receivedBy !== userId) {
            alert('ไม่ได้รับอนุญาตให้ลบข้อมูลนี้');
            return;
        }
        if (wasteEntryData.imageUrl) {
            try {
                const imageRef = storage.refFromURL(wasteEntryData.imageUrl);
                await imageRef.delete();
            } catch (storageError) {
                console.error('Error deleting image from Firebase Storage:', storageError);
            }
        }
        await wasteEntryRef.delete();
        // อัปเดตสถิติของเกษตรกร (ลด wasteReceivedCount และ stars)
        const farmerUserRef = db.collection('users').doc(userId);
        await db.runTransaction(async (transaction) => {
            const farmerUserDoc = await transaction.get(farmerUserRef);
            if (farmerUserDoc.exists) {
                const newWasteReceivedCount = Math.max(0, (farmerUserDoc.data().wasteReceivedCount || 0) - 1);
                const newStars = calculateStars(newWasteReceivedCount);
                transaction.update(farmerUserRef, {
                    wasteReceivedCount: newWasteReceivedCount,
                    stars: newStars
                });
                localStorage.setItem('userStars', newStars);
            }
        });
        alert('ลบข้อมูลสำเร็จ!');
        loadFarmerDashboard();
    } catch (error) {
        console.error('Delete Waste (Farmer) Error:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message);
    }
}

// เพิ่มฟังก์ชันลบ F2F Product
async function deleteF2FProduct(productId) {
    try {
        const productRef = db.collection('f2f_products').doc(productId);
        const productDoc = await productRef.get();
        if (!productDoc.exists) {
            alert('ไม่พบโพสต์ผลิตภัณฑ์ที่จะลบ');
            return;
        }
        const productData = productDoc.data();
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId || productData.ownerId !== userId) {
            alert('ไม่ได้รับอนุญาตให้ลบโพสต์นี้');
            return;
        }
        if (productData.imageUrl) {
            try {
                const imageRef = storage.refFromURL(productData.imageUrl);
                await imageRef.delete();
            } catch (storageError) {
                console.error('Error deleting F2F product image from Firebase Storage:', storageError);
            }
        }
        await productRef.delete();
        alert('ลบโพสต์ผลิตภัณฑ์สำเร็จ!');
        loadF2FProducts();
    } catch (error) {
        console.error('Delete F2F Product Error:', error);
        alert('เกิดข้อผิดพลาดในการลบโพสต์: ' + error.message);
    }
}
