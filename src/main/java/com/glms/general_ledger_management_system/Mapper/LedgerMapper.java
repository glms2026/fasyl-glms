package com.glms.general_ledger_management_system.Mapper;

import com.glms.general_ledger_management_system.DTO.ledger.CreateLedgerRequest;
import com.glms.general_ledger_management_system.DTO.ledger.LedgerResponse;
import com.glms.general_ledger_management_system.DTO.ledger.UpdateLedgerRequest;
import com.glms.general_ledger_management_system.Model.postgres.Ledger;
import com.glms.general_ledger_management_system.Model.postgres.LedgerStatus;
import com.glms.general_ledger_management_system.Model.postgres.User;

import org.springframework.stereotype.Component;

@Component
public class LedgerMapper {

    public Ledger toEntity(
            CreateLedgerRequest request
    ) {

        return Ledger.builder()

                .ledgerCode(
                        request.getLedgerCode()
                )

                .ledgerType(
                        request.getLedgerType()
                )

                .leaf(
                        request.getLeaf()
                )

                .ledgerDescription(
                        request.getDescription()
                )

                .status(
                        LedgerStatus.PROCESSING
                )

                .deleted(false)

                .build();
    }


    public void updateEntity(
            Ledger ledger,
            UpdateLedgerRequest request
    ) {

        ledger.setLedgerType(
                request.getLedgerType()
        );
    }


    public LedgerResponse toResponse(
            Ledger ledger
    ) {

        User creator =
                ledger.getCreatedBy();

        return LedgerResponse.builder()

                .id(
                        ledger.getId()
                )

                .ledgerCode(
                        ledger.getLedgerCode()
                )

                .ledgerType(
                        ledger.getLedgerType()
                )

                .leaf(
                        ledger.getLeaf()
                )

                .description(
                        ledger.getLedgerDescription()
                )

                .status(
                        ledger.getStatus()
                )

                .createdById(
                        creator != null
                                ? creator.getId()
                                : null
                )

                .createdByUsername(
                        creator != null
                                ? creator.getUsername()
                                : null
                )

                .createdAt(
                        ledger.getCreatedAt()
                )

                .updatedAt(
                        ledger.getUpdatedAt()
                )

                .build();
    }

}