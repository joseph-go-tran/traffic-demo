def test_register_user(client, mocker):
    data = {"username": "testuser", "password": "testing"}
    mocker.patch(
        "app.api.v1.services.user_service.create_user", return_value=True
    )
    response = client.post("/register", json=data)

    assert response.status_code == 201
    assert response.json()["message"] == "Create user successfully"


def test_register_failed(client, mocker):
    data = {"username": "testuser", "password": "testing"}
    mocker.patch(
        "app.api.v1.services.user_service.create_user", return_value=False
    )
    response = client.post("/register", json=data)

    assert response.status_code == 422
    assert response.json()["detail"] == "User name is exist"


def test_login(client, mocker):
    data = {"username": "testuser", "password": "testing"}
    mocker.patch(
        "app.api.v1.services.user_service.get_user", return_value=None
    )
    mocker.patch(
        "app.api.v1.services.auth_service.verify_password", return_value=True
    )
    response = client.post("/login", json=data)

    assert response.status_code == 200
    assert response.json()["token_type"] == "Bearer"
    assert "access_token" in response.json()


def test_login_faield(client, mocker):
    data = {"username": "testuser", "password": "testing"}
    mocker.patch(
        "app.api.v1.services.user_service.get_user", return_value=None
    )
    mocker.patch(
        "app.api.v1.services.auth_service.verify_password", return_value=False
    )
    response = client.post("/login", json=data)

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"
