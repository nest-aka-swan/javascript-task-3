'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var MINUTES_IN_HOUR = 60;
var MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;
var DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var bankTimezone = 0;

function getTimezone(dateString) {
    return dateString.match(/(\d+)$/)[0];
}

function pad(time) {
    time = time.toString();

    return time.length === 2 ? time : '0' + time;
}

function parseDateFromString(dateString) {
    var dateComponents = dateString.match(/([А-Я]{2}) (\d{2}):(\d{2})\+(\d)/);

    return {
        dayOfWeek: DAYS_OF_WEEK.indexOf(dateComponents[1]),
        hours: Number(dateComponents[2]),
        minutes: Number(dateComponents[3]),
        timezone: Number(dateComponents[4])
    };
}

function getUnifiedTime(dateString) {
    var parsedDate = parseDateFromString(dateString);
    var unifiedTime = parsedDate.dayOfWeek * MINUTES_IN_DAY +
                      parsedDate.hours * MINUTES_IN_HOUR +
                      parsedDate.minutes +
                      (bankTimezone - parsedDate.timezone) * MINUTES_IN_HOUR;

    if (unifiedTime < 0) {
        unifiedTime = 0;
    } else if (unifiedTime > 3 * MINUTES_IN_DAY - 1) {
        unifiedTime = 3 * MINUTES_IN_DAY - 1;
    }

    return unifiedTime;
}

function convertIntervalToBankTimezone(interval) {
    return {
        from: getUnifiedTime(interval.from),
        to: getUnifiedTime(interval.to)
    };
}

function getDateComponents(minutesSince) {
    var dayOfWeek = Math.floor(minutesSince / MINUTES_IN_DAY);
    minutesSince -= dayOfWeek * MINUTES_IN_DAY;
    var hours = Math.floor(minutesSince / MINUTES_IN_HOUR);
    minutesSince -= hours * MINUTES_IN_HOUR;
    var minutes = minutesSince;

    return {
        dayOfWeek: DAYS_OF_WEEK[dayOfWeek],
        hours: hours,
        minutes: minutes
    };
}

function intersect(set, el) {
    for (var i = 0; i < set.length; i++) {
        if (el.from > set[i].from && el.to < set[i].to) { // inside
            set.splice(i, 1, {
                from: set[i].from,
                to: el.from
            }, {
                from: el.to,
                to: set[i].to
            });
        } else if (el.from <= set[i].from && el.to >= set[i].to) { // bigger
            set.splice(i, 1);
        } else if (el.from < set[i].to && el.to > set[i].to) {
            set[i].to = el.from;
        } else if (el.from < set[i].from && el.to > set[i].from) {
            set[i].from = el.to;
        }
    }
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    bankTimezone = getTimezone(workingHours.from);

    var appropriateIntervals = ['ПН', 'ВТ', 'СР'].map(function (day) {
        return convertIntervalToBankTimezone({
            from: day + ' ' + workingHours.from,
            to: day + ' ' + workingHours.to
        });
    });

    schedule = (schedule.Danny || []).concat(schedule.Rusty || [], schedule.Linus || []);

    schedule.forEach(function (interval) {
        interval = convertIntervalToBankTimezone(interval);
        intersect(appropriateIntervals, interval);
    });

    appropriateIntervals = appropriateIntervals
        .filter(function (el) {
            return el.to - el.from >= duration;
        })
        .sort(function (a, b) {
            return a.from > b.from;
        });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return appropriateIntervals.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }
            var components = getDateComponents(appropriateIntervals[0].from);

            return template
                .replace(/%HH/, components.hours)
                .replace(/%MM/, pad(components.minutes))
                .replace(/%DD/, pad(components.dayOfWeek));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return false;
        }
    };
};
