# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.tests.steps import when, then, assert_200, assert_equal, get_json_data, json,\
    fail_and_print_body, apply_placeholders, json_match

from analytics.stats.gen_archive_statistics import GenArchiveStatistics


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
                        assert response_chart[key][subkey] == subvalue,\
                            'chart[{}][{}][{}] {} != {}'.format(
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


@when('we generate stats from archive history')
def step_impl_when_generate_stats_from_archive_history(context):
    with context.app.app_context():
        GenArchiveStatistics().run()


@then('we get "{report_id}" config')
def step_impl_then_we_get_config(context, report_id):
    assert_200(context.response)

    if not context.text:
        return

    data = get_json_data(context.response)

    config = next((
        c for c in (data.get('_items') or [])
        if c.get('_id') == report_id
    ), None)

    expected_config = json.loads(apply_placeholders(context, context.text))
    assert_equal(json_match(expected_config, config), True)


@then('we get stats')
def step_impl_then_get_stats_for_item(context):
    assert_200(context.response)

    if context.text:
        try:
            response_data = json.loads(context.response.get_data())
        except Exception:
            fail_and_print_body(context.response, 'response is not valid json')
            return

        stats = response_data.get('stats') or {}
        context_stats = json.loads(apply_placeholders(context, context.text))

        # parent stat entries (i.e. timeline, desk_transitions, featuremedia_updates)
        for stat_type, stat_entries in context_stats.items():
            assert stat_type in stats.keys(), 'stats.{} does not exist'.format(stat_type)

            if stat_entries is None:
                assert stats[stat_type] is None, 'stats.{} is not empty'.format(
                    stat_type
                )
                continue
            elif stats[stat_type] is None:
                assert stat_entries == stats[stat_type], 'stats.{} {} != {}'.format(
                    stat_type,
                    stats[stat_type],
                    stat_entries
                )

            assert len(stat_entries) == len(stats[stat_type]),\
                'stats.{}. len {} != {}.\nStats={}'.format(
                stat_type,
                len(stat_entries),
                len(stats[stat_type]),
                stats[stat_type]
            )

            stat_index = 0
            for stat_entry in stat_entries:
                expected_stats = stats[stat_type][stat_index]

                for key, value in stat_entry.items():
                    assert key in expected_stats.keys(), 'stats.{}[{}] key "{}" not found'.format(
                        stat_type,
                        stat_index,
                        key
                    )

                    if isinstance(value, dict):
                        for subkey, subvalue in value.items():
                            assert subkey in expected_stats[key].keys(),\
                                'stats.{}[{}][{}] key "{}" not found.\nEntry={}'.format(
                                stat_type,
                                stat_index,
                                key,
                                subkey,
                                expected_stats[key]
                            )
                            assert json_match(subvalue, expected_stats[key][subkey]),\
                                'stats.{}[{}].{}.{} {} != {}\nEntry={}'.format(
                                stat_type,
                                stat_index,
                                key,
                                subkey,
                                expected_stats[key][subkey],
                                subvalue,
                                expected_stats[key]
                            )
                    else:
                        assert expected_stats[key] == value, 'stats.{}[{}].{} {} != {}'.format(
                            stat_type,
                            stat_index,
                            key,
                            expected_stats[key],
                            value
                        )

                stat_index += 1

        return response_data
