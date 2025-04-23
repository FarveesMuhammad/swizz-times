
    
document.addEventListener('DOMContentLoaded', function() {
    const uploadButton = document.getElementById('uploadProfileButton');
    
    uploadButton.addEventListener('click', function() {
        Swal.fire({
            title: 'Upload Profile Picture',
            html: `
                <div class="upload-container">
                    <input type="file" id="profileImageInput" accept="image/*" style="display: none;">
                    <label for="profileImageInput" class="upload-label" style="display: block; padding: 10px; background: #f3f4f6; border: 2px dashed #ccc; border-radius: 5px; cursor: pointer; text-align: center; margin-bottom: 15px;">
                        Click to select an image
                    </label>
                    <div id="imagePreviewContainer" style="display: none; max-width: 100%; margin: 10px 0;">
                        <img id="imagePreview" src="" style="max-width: 100%; max-height: 300px;">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Upload',
            confirmButtonColor: '#3085d6',
            cancelButtonText: 'Close',
            didOpen: () => {
                const fileInput = document.getElementById('profileImageInput');
                const previewContainer = document.getElementById('imagePreviewContainer');
                const imagePreview = document.getElementById('imagePreview');
                
                fileInput.addEventListener('change', function(e) {
                    if (this.files && this.files[0]) {
                        const file = this.files[0];
               
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            imagePreview.src = event.target.result;
                            previewContainer.style.display = 'block';
                            
                            Swal.enableButtons();
                        };
                        reader.readAsDataURL(file);
                    }
                });
                
                Swal.disableButtons();
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const fileInput = document.getElementById('profileImageInput');
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    uploadImageToCloudinary(fileInput.files[0]);
                }
            }
        });
    });
    
    async function uploadImageToCloudinary(file) {
        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we upload your profile picture',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const cloudinaryUploadUrl = 'https://api.cloudinary.com/v1_1/dq1tnbaxt/image/upload';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ecommerce-uploads'); 
        formData.append('public_id', `profile_image_${Date.now()}`); 
        formData.append('folder', 'profiles');
        
        try {
            const response = await fetch(cloudinaryUploadUrl, {
                method: 'POST',
                body: formData,
            });
            
            const result = await response.json();
            
            if (result.secure_url) {  
              updateUserProfile(result.secure_url);
                
                Swal.fire({
                    title: 'Success!',
                    text: 'Profile picture uploaded successfully',
                    icon: 'success',
                    confirmButtonColor: '#3085d6'
                });
            } else {
                throw new Error('Image upload failed');
            }
        } catch (error) {
            console.error('Profile Image Upload Error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to upload profile picture. Please try again.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    }
    
   
    
    async function updateUserProfile(imageUrl) {
        try {
            const response = await fetch('/swizz-times/editUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ profilePicture: imageUrl }),
            });
            
            const result = await response.json();
            
            if (!result.success) {
                console.warn('Profile picture URL was saved to Cloudinary but server update failed:', result.message);
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
           
        }
    }
});

    function editFullName(){
        Swal.fire({
            title: 'Fullname',
            html: `
               <div class="upload-container">
                    <label for="fullnameInput" 
                        style="display: block; padding: 10px; background: #f3f4f6; border: 2px dashed #ccc; 
                        border-radius: 5px; text-align: center; margin-bottom: 15px; font-weight: bold;">
                        Enter Your Fullname
                    </label>
                    <input type="text" id="fullnameInput" placeholder="Type your fullname" 
                        style="width: 100%; padding: 10px; border: 2px solid #ccc; border-radius: 5px; outline: none;">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Confirm',
            confirmButtonColor: '#3085d6',
            cancelButtonText: 'Close',
            preConfirm: () => {
        const fullname = document.getElementById("fullnameInput").value;
        if (!fullname.trim()) {
            Swal.showValidationMessage("Fullname cannot be empty");
            return false;
        }
        return fullname;
        Swal.disableButtons();
    }
     }).then((result) => {
    if (result.isConfirmed) {
        const fullname = result.value;
        fetch('/swizz-times/editUser', {  
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ fullname })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {Swal.fire("Success", "Fullname saved successfully!", "success");}
                else {Swal.fire("Error", data.message || "Something went wrong", "error");}
        })
        .catch(error => {
            console.error("Error:", error);
            Swal.fire("Error", "Failed to save fullname", "error");
        });
    }
});
}

    function editEmail(){
        Swal.fire({
            title: 'Email',
            html: `
               <div class="upload-container">
                    <label for="emailInput" 
                        style="display: block; padding: 10px; background: #f3f4f6; border: 2px dashed #ccc; 
                        border-radius: 5px; text-align: center; margin-bottom: 15px; font-weight: bold;">
                        Enter Your Email
                    </label>
                    <input type="text" id="emailInput" placeholder="Type your Email" 
                        style="width: 100%; padding: 10px; border: 2px solid #ccc; border-radius: 5px; outline: none;">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Confirm',
            confirmButtonColor: '#3085d6',
            cancelButtonText: 'Close',
            preConfirm: () => {
        const email = document.getElementById("emailInput").value;
        if (!email.trim()) {
            Swal.showValidationMessage("Email cannot be empty");
            return false;
        }
        return email;
        Swal.disableButtons();
    }
     }).then((result) => {
    if (result.isConfirmed) {
        const email = result.value;
        fetch('/swizz-times/editUser', {  
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
               window.location.href = "/swizz-times/editUser/verify-otp"
            }
                else {Swal.fire("Error", data.message || "Something went wrong", "error");}
        })
        .catch(error => {
            console.error("Error:", error);
            Swal.fire("Error", "Failed to save email", "error");
        });
    }
});
}
    function editMobile(){
        Swal.fire({
            title: 'Mobile',
            html: `
               <div class="upload-container">
                    <label for="mobileInput" 
                        style="display: block; padding: 10px; background: #f3f4f6; border: 2px dashed #ccc; 
                        border-radius: 5px; text-align: center; margin-bottom: 15px; font-weight: bold;">
                        Enter Your Mobile
                    </label>
                    <input type="text" id="mobileInput" placeholder="Type your Mobile" 
                        style="width: 100%; padding: 10px; border: 2px solid #ccc; border-radius: 5px; outline: none;">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Confirm',
            confirmButtonColor: '#3085d6',
            cancelButtonText: 'Close',
            preConfirm: () => {
        const mobile = document.getElementById("mobileInput").value;
        if (!mobile.trim()) {
            Swal.showValidationMessage("mobile cannot be empty");
            return false;
        }
        return mobile;
        Swal.disableButtons();
    }
     }).then((result) => {
    if (result.isConfirmed) {
        const mobile = result.value;
        fetch('/swizz-times/editUser', {  
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ mobile })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {Swal.fire("Success", "Mobile saved successfully!", "success");}
                else {Swal.fire("Error", data.message || "Something went wrong", "error");}
        })
        .catch(error => {
            console.error("Error:", error);
            Swal.fire("Error", "Failed to save mobile", "error");
        });
    }
});
}
    function editDob(){
        Swal.fire({
            title: 'Date Of Birth',
            html: `
               <div class="upload-container">
                    <label for="dobInput" 
                        style="display: block; padding: 10px; background: #f3f4f6; border: 2px dashed #ccc; 
                        border-radius: 5px; text-align: center; margin-bottom: 15px; font-weight: bold;">
                        Enter Your Date of Birth
                    </label>
                    <input type="text" id="dobInput" placeholder="Type your Date of Birth" 
                        style="width: 100%; padding: 10px; border: 2px solid #ccc; border-radius: 5px; outline: none;">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Confirm',
            confirmButtonColor: '#3085d6',
            cancelButtonText: 'Close',
            preConfirm: () => {
        const dob = document.getElementById("dobInput").value;
        if (!dob.trim()) {
            Swal.showValidationMessage("Date of Birth cannot be empty");
            return false;
        }
        return dob;
        Swal.disableButtons();
    }
     }).then((result) => {
    if (result.isConfirmed) {
        const dob = result.value;
        fetch('/swizz-times/editUser', {  
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ dob })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {Swal.fire("Success", "Date of Birth saved successfully!", "success");}
                else {Swal.fire("Error", data.message || "Something went wrong", "error");}
        })
        .catch(error => {
            console.error("Error:", error);
            Swal.fire("Error", "Failed to save Date of Birth", "error");
        });
    }
});
}

// =============================change password===================================

document.addEventListener('DOMContentLoaded', function() {
    
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const passwordChangeForm = document.getElementById('passwordChangeForm');
    const cancelPasswordChange = document.getElementById('cancelPasswordChange');
    
    // Show password change form when button is clicked
    changePasswordBtn.addEventListener('click', function() {
        passwordChangeForm.style.display = 'block';
    });
    
    // Hide form when cancel button is clicked
    cancelPasswordChange.addEventListener('click', function() {
        passwordChangeForm.style.display = 'none';
    });
    
    
    const savePasswordChange = document.getElementById('savePasswordChange');
    savePasswordChange.addEventListener('click', function() {
       
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            Swal.fire("Error", "Every field must be there!", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            Swal.fire("Error", "New password and confirmation do not match!", "error");
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            Swal.fire("Error", "Password must have at least one uppercase letter, one lowercase letter, and be at least 6 characters long.", "error");
            return;
        }
            fetch('/swizz-times/editUser/change-password',{
                method : 'POST',
                headers :{'Content-Type':'application/json'},
                body : JSON.stringify({currentPassword,newPassword,confirmPassword})
            })
            .then(res=>res.json())
            .then(data=>{
                if (data.success) {
                        Swal.fire({
                            title: "Success!",
                            text: "Password changed successfully",
                            icon: "success",
                            confirmButtonText: "OK"
                 })
                }else{
                    Swal.fire({
                            title: "Error!",
                            text: data.message,
                            icon: "error",
                            confirmButtonText: "OK"
                 })
                }
            })
            .catch(err=>{
                console.log("Some error occured from changing password")
            })

        passwordChangeForm.style.display = 'none';
        
    });
});
    