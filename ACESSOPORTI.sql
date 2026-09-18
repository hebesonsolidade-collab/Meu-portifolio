CREATE DATABASE ACESSOPORTI;
USE ACESSOPORTI;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

INSERT INTO usuarios (nome, email, senha) 
VALUES ('Usuario Teste', 'teste@email.com', '123456');

SELECT * FROM usuarios;
show tables;