# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.tests.steps import then, assert_200, get_json_data, json,\
    fail_and_print_body, apply_placeholders


@then('we get {total_count} charts')
def step_impl_then_get_charts(context, total_count):
    assert_200(context.response)
    data = get_json_data(context.response)
    int_count = int(total_count)
    report = (data.get('_items') or [{}])[0]
    num_reports = len(report.get('highcharts'))

    assert int_count == num_reports, 'Number of charts not equal. {} != {}'.format(
        int_count,
        num_reports
    )

    if context.text:
        try:
            response_data = json.loads(context.response.get_data())
        except Exception:
            fail_and_print_body(context.response, 'response is not valid json')
            return

        report = (response_data.get('_items') or [{}])[0]
        context_data = json.loads(apply_placeholders(context, context.text))

        chart_index = 0
        for context_chart in context_data:
            response_chart = report.get('highcharts')[chart_index]

            for key, value in context_chart.items():
                if isinstance(value, dict):
                    for subkey, subvalue in value.items():
                        assert response_chart[key][subkey] == subvalue, 'chart[{}][{}][{}] {} != {}'.format(
                            chart_index,
                            key,
                            subkey,
                            subvalue,
                            response_chart[key][subkey]
                        )
                else:
                    assert response_chart[key] == value, 'chart[{}][{}] {} != {}'.format(
                        chart_index,
                        key,
                        value,
                        response_chart[key]
                    )

            chart_index += 1
        return response_data
