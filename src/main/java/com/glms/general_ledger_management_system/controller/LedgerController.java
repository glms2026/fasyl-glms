package com.glms.general_ledger_management_system.controller;

import com.glms.general_ledger_management_system.DTO.ledger.CreateLedgerRequest;
import com.glms.general_ledger_management_system.DTO.ledger.LedgerResponse;
import com.glms.general_ledger_management_system.DTO.ledger.UpdateLedgerRequest;
import com.glms.general_ledger_management_system.Service.LedgerService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/ledgers")
@RequiredArgsConstructor
public class LedgerController {


    private final LedgerService ledgerService;



    @PostMapping
    @PreAuthorize("hasAuthority('LEDGER_CREATE')")
    public ResponseEntity<LedgerResponse> createLedger(
            @Valid
            @RequestBody
            CreateLedgerRequest request
    ) {

        LedgerResponse response =
                ledgerService.createLedger(request);


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }



    @GetMapping("/my-ledgers")
    @PreAuthorize("hasAuthority('LEDGER_READ')")
    public ResponseEntity<Page<LedgerResponse>> getMyLedgers(

            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable

    ) {

        Page<LedgerResponse> response =
                ledgerService.getMyLedgers(pageable);


        return ResponseEntity.ok(response);
    }



    @GetMapping("/search")
    @PreAuthorize("hasAuthority('LEDGER_READ')")
    public ResponseEntity<Page<LedgerResponse>> searchMyLedgers(

            @RequestParam(
                    name = "keyword",
                    required = false,
                    defaultValue = ""
            )
            String keyword,

            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable

    ) {

        Page<LedgerResponse> response =
                ledgerService.searchMyLedgers(
                        keyword,
                        pageable
                );


        return ResponseEntity.ok(response);
    }


    @GetMapping("/search/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Page<LedgerResponse>> searchAllLedgers(

            @RequestParam(
                    name = "keyword",
                    required = false,
                    defaultValue = ""
            )
            String keyword,

            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable

    ) {

        Page<LedgerResponse> response =
                ledgerService.searchAllLedgers(
                        keyword,
                        pageable
                );


        return ResponseEntity.ok(response);
    }



    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Page<LedgerResponse>> getAllLedgers(

            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable

    ) {

        Page<LedgerResponse> response =
                ledgerService.getAllLedgers(pageable);


        return ResponseEntity.ok(response);
    }



    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('LEDGER_READ')")
    public ResponseEntity<LedgerResponse> getLedger(
            @PathVariable Long id
    ) {

        LedgerResponse response =
                ledgerService.getLedger(id);


        return ResponseEntity.ok(response);
    }



    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('LEDGER_UPDATE')")
    public ResponseEntity<LedgerResponse> updateLedger(

            @PathVariable Long id,

            @Valid
            @RequestBody
            UpdateLedgerRequest request

    ) {

        LedgerResponse response =
                ledgerService.updateLedger(
                        id,
                        request
                );


        return ResponseEntity.ok(response);
    }



    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('LEDGER_DELETE')")
    public ResponseEntity<Void> deleteLedger(
            @PathVariable Long id
    ) {

        ledgerService.deleteLedger(id);


        return ResponseEntity
                .noContent()
                .build();
    }

}