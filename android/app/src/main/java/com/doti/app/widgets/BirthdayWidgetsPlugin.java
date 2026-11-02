package com.doti.app.widgets;

import android.content.Intent;
import com.doti.app.MainActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;

@CapacitorPlugin(name = "BirthdayWidgets")
public class BirthdayWidgetsPlugin extends Plugin {
    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        JSObject snapshot = call.getData();
        getContext().getSharedPreferences(BirthdayWidgetProvider.PREFS, 0).edit()
            .putString(BirthdayWidgetProvider.SNAPSHOT, snapshot.toString()).apply();
        BirthdayWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void refreshWidgets(PluginCall call) {
        BirthdayWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void getWidgetCapabilities(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", true);
        result.put("widgetTypes", new JSONArray().put("birthdays"));
        call.resolve(result);
    }

    @PluginMethod
    public void consumeWidgetRoute(PluginCall call) {
        Intent intent = getActivity().getIntent();
        String route = intent == null ? null : intent.getStringExtra("doti_widget_route");
        if (intent != null) intent.removeExtra("doti_widget_route");
        JSObject result = new JSObject();
        if (route != null) result.put("route", route);
        call.resolve(result);
    }
}
