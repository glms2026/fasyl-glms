package com.glms.general_ledger_management_system.Model.postgres;


public enum UserApprovalAction {

    USER_CREATE,

    USER_UPDATE,

    USER_READ,

    USER_DEACTIVATE,
    USER_SUSPEND,
    USER_LOCK,
    USER_DELETE,
    USER_UNSUSPEND,

    ROLE_ASSIGN_PERMISSION,

    ACTIVATE_USER,

    UPDATE_PERMISSION,
    ASSIGN_ROLE,
    ASSIGN_PERMISSION,
    REMOVE_PERMISSION,

    LEDGER_CREATE
}