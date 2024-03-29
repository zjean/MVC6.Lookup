﻿/*!
 * Mvc.Lookup 0.9.1
 * https://github.com/NonFactors/MVC6.Lookup
 *
 * Copyright © NonFactors
 *
 * Licensed under the terms of the MIT License
 * http://www.opensource.org/licenses/mit-license.php
 */
(function ($) {
    $.widget('mvc.mvclookup', {
        _create: function () {
            if (!this.element.hasClass('mvc-lookup-input')) {
                return;
            }

            this._initOptions();
            this._initFilters();
            this._initAutocomplete();
            this._initLookupOpenSpan();

            this._loadSelected();
            this._cleanUp();
        },
        _initOptions: function () {
            var e = this.element;
            var o = this.options;

            o.recordsPerPage = e.attr('data-mvc-lookup-records-per-page');
            o.hiddenElement = $('#' + e.attr('data-mvc-lookup-for'))[0];
            o.filters = e.attr('data-mvc-lookup-filters').split(',');
            o.sortColumn = e.attr('data-mvc-lookup-sort-column');
            o.sortOrder = e.attr('data-mvc-lookup-sort-order');
            o.page = parseInt(e.attr('data-mvc-lookup-page'));
            o.title = e.attr('data-mvc-lookup-dialog-title');
            o.term = e.attr('data-mvc-lookup-term');
            o.url = e.attr('data-mvc-lookup-url');
        },
        _initFilters: function () {
            for (var i = 0; i < this.options.filters.length; i++) {
                this._initFilter($('#' + this.options.filters[i]));
            }
        },
        _initFilter: function (filter) {
            var that = this;
            that._on(filter, {
                change: function () {
                    var event = $.Event(that._select);
                    if (that.options.filterChange) {
                        that.options.filterChange(event, that.element[0], that.options.hiddenElement, filter[0]);
                    }

                    if (!event.isDefaultPrevented()) {
                        that._select(null, false);
                    }
                }
            });
        },
        _initAutocomplete: function () {
            var that = this;
            this.element.autocomplete({
                source: function (request, response) {
                    $.ajax({
                        url: that._formAutocompleteUrl(request.term),
                        success: function (data) {
                            response($.map(data.Rows, function (item) {
                                return {
                                    label: item.LookupAcKey,
                                    value: item.LookupAcKey,
                                    item: item
                                };
                            }));
                        }
                    });
                },
                select: function (e, selection) {
                    that._select(selection.item.item, false);
                    e.preventDefault();
                },
                minLength: 1
            });

            this.element.on('keyup.mvclookup', function (e) {
                if (e.which != 9 && this.value.length == 0 && $(that.options.hiddenElement).val()) {
                    that._select(null, false);
                }
            });
            this.element.prevAll('.ui-helper-hidden-accessible').remove();
        },
        _initLookupOpenSpan: function () {
            var lookupAddon = this.element.nextAll('.mvc-lookup-open-span:first');
            if (lookupAddon.length != 0) {
                var lookup = $('#MvcLookup');
                var that = this;

                this._on(lookupAddon, {
                    click: function () {
                        var timeout;
                        lookup
                            .find('.mvc-lookup-search-input')
                            .off('keyup.mvclookup')
                            .on('keyup.mvclookup', null, function () {
                                var input = this;
                                clearTimeout(timeout);
                                timeout = setTimeout(function () {
                                    that.options.term = input.value;
                                    that.options.page = 0;
                                    that._update(lookup);
                                }, 500);
                            })
                            .val(that.options.term);
                        lookup
                            .find('.mvc-lookup-items-per-page')
                            .spinner({
                                change: function () {
                                    this.value = that._limitTo(this.value, 1, 99);
                                    that.options.recordsPerPage = this.value;
                                    that.options.page = 0;
                                    that._update(lookup);
                                }
                            })
                            .val(that._limitTo(that.options.recordsPerPage, 1, 99));

                        lookup.find('.mvc-lookup-search-input').attr('placeholder', $.fn.mvclookup.lang.Search);
                        lookup.find('.mvc-lookup-error-span').html($.fn.mvclookup.lang.Error);
                        lookup.dialog('option', 'title', that.options.title);
                        lookup.find('.mvc-lookup-table-head').empty();
                        lookup.find('.mvc-lookup-table-body').empty();
                        that._update(lookup);

                        setTimeout(function () {
                            var dialog = lookup.dialog('open').parent();
                            dialog.position({
                                my: "center",
                                at: "center",
                                of: window
                            });

                            if (parseInt(dialog.css('left')) < 0) {
                                dialog.css('left', 0);
                            }
                            if (parseInt(dialog.css('top')) < 0) {
                                dialog.css('top', 0);
                            }
                        }, 100);
                    }
                });
            }
        },

        _formAutocompleteUrl: function (term) {
            return this.options.url +
                '?SearchTerm=' + term +
                '&RecordsPerPage=20' +
                '&SortOrder=Asc' +
                '&Page=0' +
                this._formFiltersQuery();
        },
        _formLookupUrl: function (term) {
            return this.options.url +
                '?SearchTerm=' + term +
                '&RecordsPerPage=' + this.options.recordsPerPage +
                '&SortColumn=' + this.options.sortColumn +
                '&SortOrder=' + this.options.sortOrder +
                '&Page=' + this.options.page +
                this._formFiltersQuery();
        },
        _formFiltersQuery: function () {
            var additionaFilter = '';
            for (var i = 0; i < this.options.filters.length; i++) {
                var filter = $('#' + this.options.filters[i]);
                if (filter.length == 1) {
                    additionaFilter += '&' + this.options.filters[i] + '=' + filter.val();
                }
            }

            return additionaFilter;
        },

        _defaultSelect: function (data, firstLoad) {
            if (data) {
                $(this.options.hiddenElement).val(data.LookupIdKey);
                $(this.element).val(data.LookupAcKey);
            } else {
                $(this.options.hiddenElement).val(null);
                $(this.element).val(null);
            }

            if (!firstLoad) {
                $(this.options.hiddenElement).change();
                $(this.element).change();
            }
        },
        _loadSelected: function () {
            var that = this;
            var id = $(that.options.hiddenElement).val();
            if (id) {
                $.ajax({
                    url: that.options.url + '?Id=' + id + '&RecordsPerPage=1' + this._formFiltersQuery(),
                    cache: false,
                    success: function (data) {
                        if (data.Rows.length > 0) {
                            that._select(data.Rows[0], true);
                        }
                    }
                });
            }
        },
        _select: function (data, firstLoad) {
            var event = $.Event(this._defaultSelect);
            if (this.options.select) {
                this.options.select(event, this.element[0], this.options.hiddenElement, data, firstLoad);
            }

            if (!event.isDefaultPrevented()) {
                this._defaultSelect(data, firstLoad);
            }
        },

        _limitTo: function (value, min, max) {
            value = parseInt(value);
            if (isNaN(value)) {
                return 20;
            }

            if (value < min) {
                return min;
            }

            if (value > max) {
                return max;
            }

            return value;
        },
        _cleanUp: function () {
            this.element.removeAttr('data-lookup-records-per-page');
            this.element.removeAttr('data-lookup-dialog-title');
            this.element.removeAttr('data-lookup-sort-column');
            this.element.removeAttr('data-lookup-sort-order');
            this.element.removeAttr('data-lookup-filters');
            this.element.removeAttr('data-lookup-term');
            this.element.removeAttr('data-lookup-page');
            this.element.removeAttr('data-lookup-url');
        },

        _update: function (lookup) {
            var that = this;
            var term = lookup.find('.mvc-lookup-search-input').val();

            var timeout = setTimeout(function () {
                lookup.find('.mvc-lookup-error-container').fadeOut(300);
                lookup.find('.mvc-lookup-processing').fadeIn(300);
                lookup.find('.mvc-lookup-pager').fadeOut(300);
                lookup.find('.mvc-lookup-data').fadeOut(300);
            }, 500);

            $.ajax({
                url: that._formLookupUrl(term),
                cache: false,
                success: function (data) {
                    that._updateHeader(lookup, data.Columns);
                    that._updateData(lookup, data);
                    that._updateNavbar(lookup, data.FilteredRecords);

                    clearTimeout(timeout);
                    lookup.find('.mvc-lookup-processing').fadeOut(300);
                    lookup.find('.mvc-lookup-error-container').hide();
                    lookup.find('.mvc-lookup-pager').fadeIn(300);
                    lookup.find('.mvc-lookup-data').fadeIn(300);
                },
                error: function () {
                    clearTimeout(timeout);
                    lookup.find('.mvc-lookup-error-container').fadeIn(300);
                    lookup.find('.mvc-lookup-processing').hide();
                    lookup.find('.mvc-lookup-pager').hide();
                    lookup.find('.mvc-lookup-data').hide();
                }
            });
        },
        _updateHeader: function (lookup, columns) {
            var that = this;
            var header = '';

            for (var i = 0; i < columns.length; i++) {
                var column = columns[i];
                header += '<th class="' + (column.CssClass != null ? column.CssClass : '') + '" data-column="' + column.Name + '"><span class="mvc-lookup-header-title">' + (column.Header != null ? column.Header : '') + '</span>';
                if (that.options.sortColumn == column.Name || (that.options.sortColumn == '' && i == 0)) {
                    header += '<span class="mvc-lookup-sort-arrow ' + (that.options.sortOrder == 'Asc' ? 'asc' : 'desc') + '"></span></th>';
                    that.options.sortColumn = column.Name;
                } else {
                    header += '<span class="mvc-lookup-sort-arrow"></span></th>';
                }
            }

            lookup.find('.mvc-lookup-table-head').html('<tr>' + header + '<th class="mvc-lookup-select-header"></th></tr>');
            lookup.find('.mvc-lookup-table-head th').click(function () {
                var header = $(this);
                if (!header.attr('data-column')) {
                    return false;
                }

                if (that.options.sortColumn == header.attr('data-column')) {
                    that.options.sortOrder = that.options.sortOrder == 'Asc' ? 'Desc' : 'Asc';
                } else {
                    that.options.sortOrder = 'Asc';
                }

                that.options.sortColumn = header.attr('data-column');
                that._update(lookup);
            });
        },
        _updateData: function (lookup, data) {
            if (data.Rows.length == 0) {
                var columns = (data.Columns) ? data.Columns.length + 1 : 1;
                lookup.find('.mvc-lookup-table-body').html('<tr><td colspan="' + columns + '" style="text-align: center">' + $.fn.mvclookup.lang.NoDataFound + '</td></tr>');

                return;
            }

            var tableData = '';
            for (var i = 0; i < data.Rows.length; i++) {
                var tableRow = '<tr>';
                var row = data.Rows[i];

                for (var j = 0; j < data.Columns.length; j++) {
                    var column = data.Columns[j];
                    tableRow += '<td class="' + (column.CssClass != null ? column.CssClass : '') + '">' + (row[column.Name] != null ? row[column.Name] : '') + '</td>';
                }

                tableRow += '<td class="mvc-lookup-select-cell"><div class="mvc-lookup-select-container"><i></i></div></td></tr>';
                tableData += tableRow;
            }

            lookup.find('.mvc-lookup-table-body').html(tableData);
            var selectRows = lookup.find('.mvc-lookup-table-body tr');
            for (var k = 0; k < selectRows.length; k++) {
                this._bindSelect(lookup, selectRows[k], data.Rows[k]);
            }
        },
        _updateNavbar: function (lookup, filteredRecords) {
            var pageLength = lookup.find('.mvc-lookup-items-per-page').val();
            var totalPages = parseInt(filteredRecords / pageLength) + 1;
            if (filteredRecords % pageLength == 0) {
                totalPages--;
            }

            if (totalPages == 0) {
                lookup.find('.mvc-lookup-pager > .pagination').empty();
            } else {
                this._paginate(totalPages);
            }
        },
        _paginate: function (totalPages) {
            var startingPage = Math.floor(this.options.page / 5) * 5;
            var currentPage = this.options.page;
            var page = startingPage;
            var pagination = '';
            var that = this;

            if (totalPages > 5 && currentPage > 0) {
                pagination = '<li><a href="#" data-page="0">&laquo;</a></li><li><a data-page="' + (currentPage - 1) + '">&lsaquo;</a></li>';
            }

            while (page < totalPages && page < startingPage + 5) {
                var liClass = '';
                if (page == this.options.page) {
                    liClass = ' class="active"';
                }

                pagination += '<li' + liClass + '><a href="#" data-page="' + page + '">' + (++page) + '</a></li>';
            }

            if (totalPages > 5 && currentPage < (totalPages - 1)) {
                pagination += '<li><a href="#" data-page="' + (currentPage + 1) + '">&rsaquo;</a></li><li><a href="#" data-page="' + (totalPages - 1) + '">&raquo;</a></li>';
            }

            lookup.find('.mvc-lookup-pager > .pagination').html(pagination).find('li:not(.active) > a').click(function (e) {
                that.options.page = parseInt($(this).data('page'));
                that._update(lookup);
                e.preventDefault();
            });
        },
        _bindSelect: function (lookup, selectRow, data) {
            var that = this;
            that._on(selectRow, {
                click: function () {
                    lookup.dialog('close');
                    that._select(data, false);
                }
            });
        },

        _destroy: function () {
            var e = this.element;
            var o = this.options;

            e.attr('data-mvc-lookup-records-per-page', o.recordsPerPage);
            e.attr('data-mvc-lookup-filters', o.filters.join());
            e.attr('data-mvc-lookup-sort-column', o.sortColumn);
            e.attr('data-mvc-lookup-sort-order', o.sortOrder);
            e.attr('data-mvc-lookup-dialog-title', o.title);
            e.attr('data-mvc-lookup-term', o.term);
            e.attr('data-mvc-lookup-page', o.page);
            e.attr('data-mvc-lookup-url', o.url);
            e.autocomplete('destroy');

            return this._super();
        }
    });

    $.fn.mvclookup.lang = {
        Error: 'Error while retrieving records',
        NoDataFound: 'No data found',
        Search: 'Search...'
    };

    var lookup = $('#MvcLookup');

    $(function () {
        lookup.find('.mvc-lookup-items-per-page').spinner({ min: 1, max: 99 });
        lookup.dialog({
            dialogClass: 'mvc-lookup-dialog',
            autoOpen: false,
            minHeight: 210,
            height: 'auto',
            minWidth: 455,
            width: 'auto',
            modal: true
        });

        $('.mvc-lookup-input').mvclookup();
    });
})(jQuery);
