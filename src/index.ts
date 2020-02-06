import { IncomingWebhook, IncomingWebhookDefaultArguments } from "@slack/webhook";

let webhook: IncomingWebhook;

export interface IPluginConfig extends IncomingWebhookDefaultArguments{
    url: string;
    [key: string]: any;
}

export interface ILayouts {
    basicLayout: string,
    [key: string]: any;
    layout(name: string, config: object): any;
}

function appemder(layout: any) {
    return (loggingEvent: any) => {
        webhook
            .send(layout(loggingEvent))
            .catch(err => {
                if (err) {
                    console.error('log4js:slack - Error sending log to slack: ', err);
                }
            });
    };
}

function configure(config: IPluginConfig, layouts: ILayouts) {
    let layout = layouts.basicLayout;
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }

    webhook = new IncomingWebhook(config.url, {
        username: config.username,
        channel: config.channel,
        agent: config.agent,
        icon_emoji: config.icon_emoji,
        icon_url: config.icon_url,
        link_names: config.link_names,
    });

    return appemder(layout);
}
