package com.doti.app;

import com.getcapacitor.BridgeActivity;
import com.doti.app.widgets.BirthdayWidgetsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(BirthdayWidgetsPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (bridge != null && intent.hasExtra("doti_widget_route")) {
            bridge.triggerWindowJSEvent("doti-widget-route");
        }
    }
}
