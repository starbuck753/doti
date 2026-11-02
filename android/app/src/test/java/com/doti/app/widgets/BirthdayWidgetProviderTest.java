package com.doti.app.widgets;

import static org.junit.Assert.assertEquals;

import java.util.Calendar;
import java.util.GregorianCalendar;
import org.junit.Test;

public class BirthdayWidgetProviderTest {
    private Calendar date(int year, int month, int day) { return new GregorianCalendar(year, month - 1, day); }

    @Test public void calculatesAcrossYearBoundaryAndTodayTomorrow() {
        assertEquals(0, BirthdayWidgetProvider.daysUntil(12, 31, date(2026, 12, 31)));
        assertEquals(1, BirthdayWidgetProvider.daysUntil(1, 1, date(2026, 12, 31)));
    }

    @Test public void appliesFebruary29RuleForLeapAndCommonYears() {
        assertEquals(1, BirthdayWidgetProvider.daysUntil(2, 29, date(2024, 2, 28)));
        assertEquals(1, BirthdayWidgetProvider.daysUntil(2, 29, date(2025, 2, 27)));
        assertEquals(0, BirthdayWidgetProvider.daysUntil(2, 29, date(2025, 2, 28)));
    }

    @Test public void selectsCompactMediumAndExpandedRowCounts() {
        assertEquals(1, BirthdayWidgetProvider.visibleRowsForHeight(100));
        assertEquals(3, BirthdayWidgetProvider.visibleRowsForHeight(150));
        assertEquals(5, BirthdayWidgetProvider.visibleRowsForHeight(220));
    }

    @Test public void localizesProximityLabels() {
        assertEquals("Today", BirthdayWidgetProvider.proximityLabel(0, false));
        assertEquals("Mañana", BirthdayWidgetProvider.proximityLabel(1, true));
        assertEquals("3 días", BirthdayWidgetProvider.proximityLabel(3, true));
    }
}
