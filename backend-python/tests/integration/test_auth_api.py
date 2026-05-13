"""Integration tests for authentication API endpoints."""


class TestStudentAuth:
    """Test student authentication endpoints."""

    def test_student_registration(self, client):
        """Test student registration succeeds with valid data."""
        response = client.post(
            "/auth/student/register",
            json={
                "email": "student@example.com",
                "name": "Test Student",
                "student_code": "STU001",
                "class": "12A1",
                "password": "password123",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "student@example.com"
        assert data["name"] == "Test Student"
        assert data["student_code"] == "STU001"
        assert "id" in data
        assert "created_at" in data
        assert data["is_active"] is True

    def test_student_registration_duplicate_email(self, client):
        """Test student registration fails with duplicate email."""
        # First registration
        client.post(
            "/auth/student/register",
            json={
                "email": "duplicate@example.com",
                "name": "First Student",
                "student_code": "STU002",
                "password": "password123",
            },
        )

        # Second registration with same email
        response = client.post(
            "/auth/student/register",
            json={
                "email": "duplicate@example.com",
                "name": "Second Student",
                "student_code": "STU003",
                "password": "password123",
            },
        )
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    def test_student_login_success(self, client):
        """Test student login with valid credentials."""
        # Register first
        client.post(
            "/auth/student/register",
            json={
                "email": "login_test@example.com",
                "name": "Login Test",
                "student_code": "STU004",
                "password": "password123",
            },
        )

        # Login
        response = client.post(
            "/auth/student/login",
            json={
                "email": "login_test@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_student_login_invalid_password(self, client):
        """Test student login fails with wrong password."""
        # Register
        client.post(
            "/auth/student/register",
            json={
                "email": "nopass@example.com",
                "name": "No Pass",
                "student_code": "STU005",
                "password": "correctpassword",
            },
        )

        # Login with wrong password
        response = client.post(
            "/auth/student/login",
            json={
                "email": "nopass@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_student_get_profile(self, client):
        """Test getting student profile with valid token."""
        # Register and login
        client.post(
            "/auth/student/register",
            json={
                "email": "profile@example.com",
                "name": "Profile Test",
                "student_code": "STU006",
                "password": "password123",
            },
        )

        login_response = client.post(
            "/auth/student/login",
            json={
                "email": "profile@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Get profile
        response = client.get(
            "/auth/student/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "profile@example.com"
        assert data["name"] == "Profile Test"

    def test_student_get_profile_invalid_token(self, client):
        """Test getting profile with invalid token."""
        response = client.get(
            "/auth/student/me",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert response.status_code == 401

    def test_student_refresh_token(self, client):
        """Test refresh token flow."""
        # Register and login
        client.post(
            "/auth/student/register",
            json={
                "email": "refresh@example.com",
                "name": "Refresh Test",
                "student_code": "STU007",
                "password": "password123",
            },
        )

        login_response = client.post(
            "/auth/student/login",
            json={
                "email": "refresh@example.com",
                "password": "password123",
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        # Refresh tokens
        response = client.post(
            "/auth/student/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

        # Old refresh token should be revoked (cannot be used again)
        refresh_response2 = client.post(
            "/auth/student/refresh",
            json={"refresh_token": refresh_token},
        )
        assert refresh_response2.status_code == 401

    def test_student_logout(self, client):
        """Test logout revokes refresh token."""
        # Register and login
        client.post(
            "/auth/student/register",
            json={
                "email": "logout@example.com",
                "name": "Logout Test",
                "student_code": "STU008",
                "password": "password123",
            },
        )

        login_response = client.post(
            "/auth/student/login",
            json={
                "email": "logout@example.com",
                "password": "password123",
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        # Logout
        response = client.post(
            "/auth/student/logout",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"

        # Try to use revoked refresh token
        refresh_response = client.post(
            "/auth/student/refresh",
            json={"refresh_token": refresh_token},
        )
        assert refresh_response.status_code == 401


class TestTeacherAuth:
    """Test teacher authentication endpoints."""

    def test_teacher_registration(self, client):
        """Test teacher registration succeeds with valid data."""
        response = client.post(
            "/auth/teacher/register",
            json={
                "email": "teacher@example.com",
                "name": "Test Teacher",
                "role": "teacher",
                "password": "password123",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "teacher@example.com"
        assert data["name"] == "Test Teacher"
        assert data["role"] == "teacher"
        assert "id" in data
        assert "created_at" in data
        assert data["is_active"] is True

    def test_teacher_registration_with_admin_role(self, client):
        """Test teacher registration with admin role."""
        response = client.post(
            "/auth/teacher/register",
            json={
                "email": "admin@example.com",
                "name": "Admin Teacher",
                "role": "admin",
                "password": "admin123",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["role"] == "admin"

    def test_teacher_registration_nonexistent_role(self, client):
        """Test teacher registration fails with invalid role."""
        response = client.post(
            "/auth/teacher/register",
            json={
                "email": "teacher2@example.com",
                "name": "Test Teacher 2",
                "role": "supervisor",  # Role doesn't exist in seed
                "password": "password123",
            },
        )
        assert response.status_code == 400
        assert "does not exist" in response.json()["detail"]

    def test_teacher_registration_duplicate_email(self, client):
        """Test teacher registration fails with duplicate email."""
        # First registration
        client.post(
            "/auth/teacher/register",
            json={
                "email": "dup_teacher@example.com",
                "name": "First Teacher",
                "role": "teacher",
                "password": "password123",
            },
        )

        # Second registration with same email
        response = client.post(
            "/auth/teacher/register",
            json={
                "email": "dup_teacher@example.com",
                "name": "Second Teacher",
                "role": "teacher",
                "password": "password123",
            },
        )
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    def test_teacher_login_success(self, client):
        """Test teacher login with valid credentials."""
        # Register
        client.post(
            "/auth/teacher/register",
            json={
                "email": "teacher_login@example.com",
                "name": "Teacher Login",
                "role": "teacher",
                "password": "password123",
            },
        )

        # Login
        response = client.post(
            "/auth/teacher/login",
            json={
                "email": "teacher_login@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_teacher_login_invalid_password(self, client):
        """Test teacher login fails with wrong password."""
        # Register
        client.post(
            "/auth/teacher/register",
            json={
                "email": "teach_wrong@example.com",
                "name": "Wrong Pass Teacher",
                "role": "teacher",
                "password": "correctpassword",
            },
        )

        # Login with wrong password
        response = client.post(
            "/auth/teacher/login",
            json={
                "email": "teach_wrong@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

    def test_teacher_get_profile(self, client):
        """Test getting teacher profile with valid token."""
        # Register and login
        client.post(
            "/auth/teacher/register",
            json={
                "email": "teacher_profile@example.com",
                "name": "Teacher Profile",
                "role": "admin",
                "password": "password123",
            },
        )

        login_response = client.post(
            "/auth/teacher/login",
            json={
                "email": "teacher_profile@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Get profile
        response = client.get(
            "/auth/teacher/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "teacher_profile@example.com"
        assert data["name"] == "Teacher Profile"
        assert data["role"] == "admin"

    def test_teacher_refresh_token(self, client):
        """Test refresh token flow for teacher."""
        # Register and login
        client.post(
            "/auth/teacher/register",
            json={
                "email": "teacher_refresh@example.com",
                "name": "Teacher Refresh",
                "role": "teacher",
                "password": "password123",
            },
        )

        login_response = client.post(
            "/auth/teacher/login",
            json={
                "email": "teacher_refresh@example.com",
                "password": "password123",
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        # Refresh tokens
        response = client.post(
            "/auth/teacher/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_teacher_logout(self, client):
        """Test logout revokes refresh token for teacher."""
        # Register and login
        client.post(
            "/auth/teacher/register",
            json={
                "email": "teacher_logout@example.com",
                "name": "Teacher Logout",
                "role": "teacher",
                "password": "password123",
            },
        )

        login_response = client.post(
            "/auth/teacher/login",
            json={
                "email": "teacher_logout@example.com",
                "password": "password123",
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        # Logout
        response = client.post(
            "/auth/teacher/logout",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200

        # Try to use revoked refresh token
        refresh_response = client.post(
            "/auth/teacher/refresh",
            json={"refresh_token": refresh_token},
        )
        assert refresh_response.status_code == 401


class TestTokenSeparation:
    """Test that student and teacher tokens are not interchangeable."""

    def test_student_token_cannot_access_teacher_endpoints(self, client):
        """Test student token is rejected by teacher endpoints."""
        # Register and login as student
        client.post(
            "/auth/student/register",
            json={
                "email": "cross_test@example.com",
                "name": "Cross Test Student",
                "student_code": "STU009",
                "password": "password123",
            },
        )

        login_response = client.post(
            "/auth/student/login",
            json={
                "email": "cross_test@example.com",
                "password": "password123",
            },
        )
        student_token = login_response.json()["access_token"]

        # Try to access teacher endpoint with student token
        response = client.get(
            "/auth/teacher/me",
            headers={"Authorization": f"Bearer {student_token}"},
        )
        assert response.status_code == 401  # Unauthorized

    def test_teacher_token_cannot_access_student_endpoints(self, client):
        """Test teacher token is rejected by student endpoints."""
        # Register and login as teacher
        client.post(
            "/auth/teacher/register",
            json={
                "email": "cross_teacher@example.com",
                "name": "Cross Test Teacher",
                "role": "teacher",
                "password": "password123",
            },
        )

        login_response = client.post(
            "/auth/teacher/login",
            json={
                "email": "cross_teacher@example.com",
                "password": "password123",
            },
        )
        teacher_token = login_response.json()["access_token"]

        # Try to access student endpoint with teacher token
        response = client.get(
            "/auth/student/me",
            headers={"Authorization": f"Bearer {teacher_token}"},
        )
        assert response.status_code == 401  # Unauthorized


class TestPermissionAuthorization:
    """Test permission-based authorization for teachers."""

    def test_permission_endpoint_requires_permission(self, client):
        """Test that protected endpoints require specific permissions."""
        # Create a teacher with no permissions (if possible) or minimal permissions
        # For now, we'll test with the seeded teacher role which has permissions

        # Register a teacher with admin role (has all permissions)
        client.post(
            "/auth/teacher/register",
            json={
                "email": "perm_admin@example.com",
                "name": "Perm Admin",
                "role": "admin",
                "password": "password123",
            },
        )

        login_response = client.post(
            "/auth/teacher/login",
            json={
                "email": "perm_admin@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # This endpoint should require a permission (to be implemented in domain endpoints)
        # For now, we verify the teacher can access their profile
        response = client.get(
            "/auth/teacher/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
