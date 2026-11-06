package com.doti.app.widgets;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import com.doti.app.MainActivity;
import com.doti.app.R;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Comparator;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class BirthdayWidgetProvider extends AppWidgetProvider {
    public static final String PREFS = "doti_widget_private";
    public static final String SNAPSHOT = "birthday_snapshot";
    private static final String ACTION_MIDNIGHT = "com.doti.app.widgets.MIDNIGHT";
    private static final long DAY_MILLIS = 86_400_000L;

    private static final class Item {
        final String name; final int days; final Calendar occurrence;
        Item(String name, int days, Calendar occurrence) { this.name = name; this.days = days; this.occurrence = occurrence; }
    }

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) render(context, manager, id);
        scheduleMidnight(context);
    }
    @Override public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) { render(context, manager, id); }
    @Override public void onEnabled(Context context) { scheduleMidnight(context); }

    @Override public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_MIDNIGHT.equals(action) || Intent.ACTION_DATE_CHANGED.equals(action) ||
            Intent.ACTION_TIME_CHANGED.equals(action) || Intent.ACTION_TIMEZONE_CHANGED.equals(action) ||
            Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            Intent.ACTION_CONFIGURATION_CHANGED.equals(action)) refreshAll(context);
        if (ACTION_MIDNIGHT.equals(action) || Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_DATE_CHANGED.equals(action) || Intent.ACTION_TIME_CHANGED.equals(action) ||
            Intent.ACTION_TIMEZONE_CHANGED.equals(action)) scheduleMidnight(context);
    }

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, BirthdayWidgetProvider.class));
        for (int id : ids) render(context, manager, id);
    }

    private static void render(Context context, AppWidgetManager manager, int id) {
        JSONObject snapshot;
        try { snapshot = new JSONObject(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(SNAPSHOT, "{}")); }
        catch (Exception ignored) { snapshot = new JSONObject(); }
        boolean spanish = "es".equals(snapshot.optString("language", "en"));
        int uiMode = context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean dark = "dark".equals(snapshot.optString("theme")) ||
            (!"light".equals(snapshot.optString("theme")) && uiMode == Configuration.UI_MODE_NIGHT_YES);
        Calendar today = Calendar.getInstance();
        long todayOrdinal = ordinal(today);
        List<Item> items = new ArrayList<>();
        JSONArray birthdays = snapshot.optJSONArray("birthdays");
        if (birthdays != null) for (int i = 0; i < birthdays.length(); i++) {
            JSONObject birthday = birthdays.optJSONObject(i);
            if (birthday == null) continue;
            int month = birthday.optInt("month", 0), day = birthday.optInt("day", 0);
            if (month < 1 || month > 12 || day < 1 || day > 31) continue;
            Calendar occurrence = occurrence(today.get(Calendar.YEAR), month, day);
            if (ordinal(occurrence) < todayOrdinal) occurrence = occurrence(today.get(Calendar.YEAR) + 1, month, day);
            items.add(new Item(birthday.optString("name"), daysUntil(month, day, today), occurrence));
        }
        items.sort(Comparator.comparingInt((Item item) -> item.days).thenComparing(item -> item.name.toLowerCase(Locale.ROOT)));

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_birthdays);
        views.setTextViewText(R.id.widget_header, spanish ? "Próximos cumpleaños" : "Upcoming Birthdays");
        int height = manager.getAppWidgetOptions(id).getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 220);
        int count = visibleRowsForHeight(height);
        views.setViewVisibility(R.id.widget_empty, items.isEmpty() ? View.VISIBLE : View.GONE);
        views.setTextViewText(R.id.widget_empty, spanish ? "Aún no hay cumpleaños" : "No birthdays yet");
        for (int i = 0; i < 5; i++) {
            int row = context.getResources().getIdentifier("widget_row_" + i, "id", context.getPackageName());
            int name = context.getResources().getIdentifier("widget_name_" + i, "id", context.getPackageName());
            int date = context.getResources().getIdentifier("widget_date_" + i, "id", context.getPackageName());
            int proximity = context.getResources().getIdentifier("widget_days_" + i, "id", context.getPackageName());
            Item item = i < items.size() ? items.get(i) : null;
            views.setViewVisibility(row, item != null && i < count ? View.VISIBLE : View.GONE);
            if (item == null) continue;
            Locale locale = spanish ? new Locale("es") : Locale.ENGLISH;
            views.setTextViewText(name, item.name);
            views.setTextViewText(date, new SimpleDateFormat(spanish ? "d MMM" : "MMM d", locale).format(item.occurrence.getTime()));
            String label = proximityLabel(item.days, spanish);
            views.setTextViewText(proximity, label);
            int bg = item.days == 0 ? color(context, R.color.widget_today, R.color.widget_today_dark, dark) :
                item.days <= 7 ? color(context, R.color.widget_soon, R.color.widget_soon_dark, dark) :
                color(context, R.color.widget_neutral, R.color.widget_neutral_dark, dark);
            views.setInt(proximity, "setBackgroundColor", bg);
            views.setTextColor(proximity, color(context, R.color.widget_text, R.color.widget_text_dark, dark));
            views.setTextColor(name, color(context, R.color.widget_text, R.color.widget_text_dark, dark));
            views.setTextColor(date, color(context, R.color.widget_muted, R.color.widget_muted_dark, dark));
        }
        views.setTextColor(R.id.widget_header, color(context, R.color.widget_text, R.color.widget_text_dark, dark));
        views.setTextColor(R.id.widget_empty, color(context, R.color.widget_muted, R.color.widget_muted_dark, dark));
        views.setInt(R.id.widget_root, "setBackgroundResource", dark ? R.drawable.widget_background_dark : R.drawable.widget_background);
        Intent open = new Intent(context, MainActivity.class).putExtra("doti_widget_route", "/birthdays")
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pending = PendingIntent.getActivity(context, id, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, pending);
        manager.updateAppWidget(id, views);
    }

    private static int color(Context context, int light, int night, boolean dark) { return context.getColor(dark ? night : light); }
    static int daysUntil(int month, int day, Calendar today) {
        Calendar occurrence = occurrence(today.get(Calendar.YEAR), month, day);
        if (ordinal(occurrence) < ordinal(today)) occurrence = occurrence(today.get(Calendar.YEAR) + 1, month, day);
        return (int)(ordinal(occurrence) - ordinal(today));
    }
    static int visibleRowsForHeight(int heightDp) { return heightDp < 115 ? 1 : heightDp < 190 ? 3 : 5; }
    static String proximityLabel(int days, boolean spanish) {
        if (days == 0) return spanish ? "Hoy" : "Today";
        if (days == 1) return spanish ? "Mañana" : "Tomorrow";
        return spanish ? days + " días" : days + " days";
    }
    private static long ordinal(Calendar date) {
        Calendar utc = new GregorianCalendar(TimeZone.getTimeZone("UTC"));
        utc.clear(); utc.set(date.get(Calendar.YEAR), date.get(Calendar.MONTH), date.get(Calendar.DAY_OF_MONTH));
        return utc.getTimeInMillis() / DAY_MILLIS;
    }
    private static Calendar occurrence(int year, int month, int day) {
        int actualDay = month == 2 && day == 29 && !new GregorianCalendar().isLeapYear(year) ? 28 : day;
        return new GregorianCalendar(year, month - 1, actualDay);
    }
    private static void scheduleMidnight(Context context) {
        AlarmManager manager = (AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, BirthdayWidgetProvider.class).setAction(ACTION_MIDNIGHT);
        PendingIntent pending = PendingIntent.getBroadcast(context, 1717, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Calendar next = Calendar.getInstance(); next.add(Calendar.DAY_OF_YEAR, 1); next.set(Calendar.HOUR_OF_DAY, 0);
        next.set(Calendar.MINUTE, 2); next.set(Calendar.SECOND, 0); next.set(Calendar.MILLISECOND, 0);
        if (Build.VERSION.SDK_INT >= 23) manager.setAndAllowWhileIdle(AlarmManager.RTC, next.getTimeInMillis(), pending);
        else manager.set(AlarmManager.RTC, next.getTimeInMillis(), pending);
    }
}
