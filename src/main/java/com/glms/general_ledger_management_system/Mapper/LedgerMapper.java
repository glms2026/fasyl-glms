package com.glms.general_ledger_management_system.Mapper;

import com.glms.general_ledger_management_system.DTO.ledger.CreateLedgerRequest;
import com.glms.general_ledger_management_system.DTO.ledger.LedgerResponse;
import com.glms.general_ledger_management_system.DTO.ledger.UpdateLedgerRequest;
import com.glms.general_ledger_management_system.Model.Ledger;
import com.glms.general_ledger_management_system.Model.LedgerStatus;
import com.glms.general_ledger_management_system.Model.User;

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

                .ledgerName(
                        request.getLedgerName()
                )

                .description(
                        request.getDescription()
                )

                .ledgerType(
                        request.getLedgerType()
                )

                .status(
                        LedgerStatus.ACTIVE
                )

                .deleted(false)

                .build();
    }


    public void updateEntity(
            Ledger ledger,
            UpdateLedgerRequest request
    ) {

        ledger.setLedgerName(
                request.getLedgerName()
        );

        ledger.setDescription(
                request.getDescription()
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

                .ledgerName(
                        ledger.getLedgerName()
                )

                .description(
                        ledger.getDescription()
                )

                .ledgerType(
                        ledger.getLedgerType()
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