# Gateway

API Gateway - Reverse Proxy - Load Balancer

## Notice: You need to install docker engine and UFW first.
- Install docker engine: View the docker install documents

- Install ufw:
```sh
apt install ufw
```

***`How to config`***

- Assign permission for running shell execution
```sh
chmod +x easy.sh ufw_allow_ssh.sh ufw_allow.sh ufw_docker_install.sh
```

- Running easy script and input the needed informations
```sh
./easy.sh
```

- Running docker compose to start gateway services ***(for testing purpose only)***
```sh
docker compose up
```
Note: if everythings go well then running with deamon mode (for real run)

- Running docker compose to start gateway services ***(for real run)***
```sh
docker compose up -d
```

***`To test the gateway really work after running:`***
- access to your gateway domain (default account: admin/Ekila@10724)
- access to grafana domain (default account: admin/admin)
