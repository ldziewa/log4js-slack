import { IncomingWebhook, IncomingWebhookDefaultArguments } from "@slack/webhook";
import { SeverityLevel } from "./SeverityLevel";

let webhook: IncomingWebhook;
let severityLevel: number = SeverityLevel.DEBUG;
let showWebhookErrors: boolean = true;

export interface IPluginConfig extends IncomingWebhookDefaultArguments {
    url: string;

    level?: string;

    [key: string]: any;
}

export interface ILayouts {
    basicLayout: string,

    [key: string]: any;

    layout(name: string, config: object): any;
}

function logLevelIsGreaterThanOrEqualTo(level: string): boolean {
    return severityLevel >= SeverityLevel[level as keyof typeof SeverityLevel];
}

function appender(layout: any) {
    return (loggingEvent: any) => {
        if (!logLevelIsGreaterThanOrEqualTo(loggingEvent.level.levelStr.toUpperCase())) {
            return;
        }

        webhook
            .send(layout(loggingEvent))
            .catch(err => {
                if (showWebhookErrors) {
                    console.error('log4js:slack - Error sending log to slack: ', err);
                }
            });
    };
}

export function configure(config: IPluginConfig, layouts: ILayouts): Function {
    let layout = layouts.basicLayout;
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }

    if (config.level) {
        severityLevel = SeverityLevel[config.level.toUpperCase() as keyof typeof SeverityLevel];
        if (typeof severityLevel === 'undefined') {
            throw new Error('Unsupported severity level');
        }
    }

    if (config.show_webhook_errors) {
        showWebhookErrors = config.show_webhook_errors;
    }

    webhook = new IncomingWebhook(config.url, {
        username: config.username,
        channel: config.channel,
        agent: config.agent,
        icon_emoji: config.icon_emoji,
        icon_url: config.icon_url,
        link_names: config.link_names,
    });

    return appender(layout);
}
