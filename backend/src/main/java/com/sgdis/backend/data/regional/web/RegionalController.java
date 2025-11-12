package com.sgdis.backend.data.regional.web;

import com.sgdis.backend.data.regional.dto.RegionalResponse;
import com.sgdis.backend.data.regional.entity.RegionalEntity;
import com.sgdis.backend.data.regional.mapper.RegionalMapper;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/regional")
public class RegionalController {

    private final SpringDataRegionalRepository repository;

    @GetMapping
    public List<RegionalResponse> getAllRegionals() {
        return RegionalMapper.toResponse(repository.findAll());
    }
}
