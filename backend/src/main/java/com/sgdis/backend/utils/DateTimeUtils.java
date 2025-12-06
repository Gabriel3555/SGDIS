package com.sgdis.backend.utils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Utilidad para manejar fechas y horas en la zona horaria de Colombia (GMT-5)
 */
public final class DateTimeUtils {

    private static final ZoneId COLOMBIA_ZONE = ZoneId.of("America/Bogota");

    private DateTimeUtils() {
        // Clase de utilidad, no debe ser instanciada
    }

    /**
     * Obtiene la fecha y hora actual en la zona horaria de Colombia (GMT-5)
     * @return LocalDateTime con la fecha y hora actual de Colombia
     */
    public static LocalDateTime now() {
        return ZonedDateTime.now(COLOMBIA_ZONE).toLocalDateTime();
    }

    /**
     * Obtiene la zona horaria de Colombia
     * @return ZoneId de Colombia (America/Bogota)
     */
    public static ZoneId getColombiaZone() {
        return COLOMBIA_ZONE;
    }
}
