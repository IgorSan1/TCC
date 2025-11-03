package com.saude_indigena.dto;

import com.saude_indigena.model.UserRole;

public record RegisterDTO(String usuario, String password, UserRole role) {
}
