package com.glms.general_ledger_management_system;

public final class Permissions {

    private Permissions() {
//        // Prevent instantiation
   }

    public static final String USER_CREATE = "USER_CREATE";
    public static final String USER_UPDATE = "USER_UPDATE";
    public static final String USER_DELETE = "USER_DELETE";

    public static final String LEDGER_CREATE = "LEDGER_CREATE";
    public static final String LEDGER_VIEW_ALL = "LEDGER_VIEW_ALL";

    // Add the remaining permissions...
}