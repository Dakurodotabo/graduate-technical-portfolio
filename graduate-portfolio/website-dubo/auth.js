const API_BASE_URL = '/api';

// Load user data on page load
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'Home.HTML'; // Redirect to home page
}

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        const userNameElem = document.getElementById('user-name');
        if (userNameElem) {
            userNameElem.textContent = currentUser.name;
        }
        const userEmailElem = document.getElementById('user-email');
        if (userEmailElem) {
            userEmailElem.textContent = currentUser.email;
        }
        const profilePicElem = document.getElementById('profile-picture');
        if (profilePicElem) {
            if (currentUser.profile_picture) {
                profilePicElem.src = currentUser.profile_picture;
            } else {
                profilePicElem.src = '/uploads/Default Profile.jpg';
            }
        }

        // Fetch membership details
        fetch(`${API_BASE_URL}/profile/membership`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser.id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.membership) {
                document.getElementById('membership-plan').textContent = data.membership.plan;
                document.getElementById('training-hours').textContent = data.membership.training_hours;
                document.getElementById('trainer-name').textContent = data.membership.trainer;
                document.getElementById('next-session').textContent = data.membership.next_session;
                document.getElementById('membership-status').textContent = data.membership.active ? 'Active' : 'Cancelled';

                const cancelButton = document.getElementById('cancel-membership-button');
                if (data.membership.active) {
                    cancelButton.style.display = 'inline-block';
                    cancelButton.addEventListener('click', () => {
                        if (confirm('Are you sure you want to cancel your membership?')) {
                            fetch(`${API_BASE_URL}/profile/membership/cancel`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ userId: currentUser.id })
                            })
                            .then(res => res.json())
                            .then(resData => {
                                alert(resData.message || 'Membership cancelled');
                                // Update status and hide button
                                document.getElementById('membership-status').textContent = 'Cancelled';
                                cancelButton.style.display = 'none';
                            })
                            .catch(() => {
                                alert('Failed to cancel membership');
                            });
                        }
                    });
                } else {
                    cancelButton.style.display = 'none';
                }
            }
        })
        .catch(() => {
            console.error('Failed to fetch membership details');
            // Hide membership details section or show error message
            const membershipSection = document.getElementById('membership-section');
            if (membershipSection) {
                membershipSection.style.display = 'none';
            }
            const membershipError = document.getElementById('membership-error');
            if (membershipError) {
                membershipError.textContent = 'Unable to load membership details at this time.';
                membershipError.style.color = 'red';
                membershipError.style.display = 'block';
            }
        });

        // Add to Cart functionality for Booking page
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartItemsElem = document.getElementById('cart-items');
        const cartTotalElem = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');

        function updateCartUI() {
            if (!cartItemsElem || !cartTotalElem || !checkoutBtn) return;
            cartItemsElem.innerHTML = '';
            let total = 0;
            cart.forEach((item, index) => {
                const li = document.createElement('li');
                li.textContent = `${item.name} - £${item.price} `;
                // Add remove button
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.style.marginLeft = '10px';
                removeBtn.addEventListener('click', () => {
                    cart.splice(index, 1);
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartUI();
                });
                li.appendChild(removeBtn);
                cartItemsElem.appendChild(li);
                total += item.price;
            });
            cartTotalElem.textContent = `Total: £${total.toFixed(2)}`;
            checkoutBtn.disabled = cart.length === 0;
        }

        function addToCart(item) {
            // For "Test it out" plan, check if already in cart or used
            if (item.id === 'test-it-out') {
                if (cart.some(ci => ci.id === 'test-it-out')) {
                    alert('You can only add the "Test it out" plan once.');
                    return;
                }
                // Optionally, check if user already used this plan (requires backend support)
            }
            cart.push(item);
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartUI();
        }

        updateCartUI();

        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const classItem = e.target.closest('.class-item');
                if (!classItem) return;
                const id = classItem.getAttribute('data-class-id');
                const nameElem = classItem.querySelector('h3');
                const priceAttr = classItem.getAttribute('data-price');
                const price = priceAttr ? parseFloat(priceAttr) : 0;
                const name = nameElem ? nameElem.textContent : 'Unknown';
                addToCart({ id, name, price });
            });
        });

        // Proceed to Checkout button handler
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const cartSection = document.getElementById('cart');
                const checkoutSection = document.getElementById('checkout');
                const paymentFieldset = document.querySelector('#checkout fieldset');
                if (cartSection && checkoutSection) {
                    cartSection.style.display = 'none';
                    checkoutSection.style.display = 'block';
                    // Check if cart contains only "test-it-out" plan to hide payment fields
                    const onlyTestPlan = cart.length === 1 && cart[0].id === 'test-it-out';
                    if (paymentFieldset) {
                        paymentFieldset.style.display = onlyTestPlan ? 'none' : 'block';
                        // Toggle disabled and required attributes on payment inputs
                        const inputs = paymentFieldset.querySelectorAll('input');
                        inputs.forEach(input => {
                            if (onlyTestPlan) {
                                input.disabled = true;
                                input.required = false;
                            } else {
                                input.disabled = false;
                                input.required = true;
                            }
                        });
                    }
                }
            });
        }

        // Checkout form submission handler
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                console.log('Checkout form submitted');
                e.preventDefault();
                // Check if cart contains only "test-it-out" plan
                const onlyTestPlan = cart.length === 1 && cart[0].id === 'test-it-out';
                if (onlyTestPlan) {
                    alert('Test it out plan activated immediately! No payment required.');
                } else {
                    alert('Booking completed successfully!');
                }
                // Clear cart
                localStorage.removeItem('cart');
                updateCartUI();
                // Hide checkout form and show confirmation
                const checkoutSection = document.getElementById('checkout');
                const confirmationSection = document.getElementById('confirmation');
                if (checkoutSection && confirmationSection) {
                    checkoutSection.style.display = 'none';
                    confirmationSection.style.display = 'block';
                }
            });
        }
    } else {
        const profilePicElem = document.getElementById('profile-picture');
        if (profilePicElem) {
            profilePicElem.src = '/uploads/Default Profile.jpg';
        }
    }

// Logout handler for logout-button and logout-link
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Logout button clicked');
        localStorage.removeItem('currentUser');
        console.log('currentUser removed from localStorage');
        window.location.href = 'Home.HTML'; // Redirect to home page
    });
}
const logoutLink = document.getElementById('logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Logout link clicked');
        localStorage.removeItem('currentUser');
        console.log('currentUser removed from localStorage');
        window.location.href = 'Home.HTML'; // Redirect to home page
    });
}

    // Profile picture upload handler
const profilePictureForm = document.getElementById('profile-picture-form');
if (profilePictureForm) {
    profilePictureForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('profile-picture-input');
        const file = fileInput.files[0];
        console.log('Uploading file:', file);

        const formData = new FormData();
        formData.append('profile_picture', file);
        formData.append('userId', currentUser.id);

        try {
            const response = await fetch(`${API_BASE_URL}/profile/picture`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                // Update local storage and UI
                currentUser.profile_picture = URL.createObjectURL(file);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                document.getElementById('profile-picture').src = currentUser.profile_picture;
                alert('Profile picture updated successfully!');
            } else {
                alert(data.error || 'Failed to update profile picture');
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    });
}

    // Password change handler
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                alert('New passwords do not match!');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/profile/password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        currentPassword,
                        newPassword
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    alert('Password changed successfully!');
                    changePasswordForm.reset();
                } else {
                    alert(data.error || 'Failed to change password');
                }
            } catch (error) {
                alert('Network error. Please try again.');
            }
        });
    }

    // Signup form
    const signupForm = document.querySelector('#signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            
            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Signup successful! Please login.');
                    window.location.href = 'Login.HTML';
                } else {
                    alert(data.error || 'Registration failed');
                }
            } catch (error) {
                alert('Network error. Please try again.');
            }
        });
    }

    // Login form
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('error-message');
            
            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    errorElement.textContent = ''; // Clear any previous error message
                    alert('Login successful!');
                    window.location.href = 'Profile.HTML';
                } else {
                    errorElement.textContent = data.error || 'Login failed';
                }
            } catch (error) {
                errorElement.textContent = 'Network error. Please try again.';
            }
        });
    }
});
