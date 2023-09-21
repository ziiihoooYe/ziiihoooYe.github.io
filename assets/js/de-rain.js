(function () {
    function extractIndex(href) {
        const regex = /rn(\d+)\.png$/;
        const match = href.match(regex);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
        return null;
    }

    function imageExists(url, callback) {
        var img = new Image();
        img.onload = function () { callback(true); };
        img.onerror = function () { callback(false); };
        img.src = url;
    }

    function cross_fade_image(image_node, new_link, group_node, transition_duration) {
        var original_x = +image_node.attr('x');
        var original_y = +image_node.attr('y');
        var original_width = +image_node.attr('width');
        var original_height = +image_node.attr('height');

        var new_image = group_node.append('svg:image')
            .attr('id', 'transition_' + image_node.id)
            .attr('width', original_width)
            .attr('height', original_height)
            .attr('xlink:href', image_node.attr('xlink:href'))
            .attr('x', original_x)
            .attr('y', original_y)
            .style('opacity', 1.0);

        image_node
            .attr('xlink:href', new_link);

        image_node
            .transition()
            .duration(transition_duration);

        new_image
            .transition()
            .duration(transition_duration)
            .style('opacity', 0.0)
            .attr('x', original_x)
            .attr('y', original_y)
            .remove();
    }

    function de_rain_fig() {
        var margin = ({
            top: 10,
            right: 60,
            bottom: 30,
            left: 60
        });

        var image_size = 70;
        var image_padding_columns = 5;
        var image_padding_rows = 10;
        var columns = 2;
        var rows = 2;
        var image_ratio = 2;

        var indicator_image_size = 25;
        var indicator_image_padding = 3;
        var indicator_box_top_padding = 8;

        var button_width = 60;
        var button_height = 20;
        var button_padding = 4;

        var zoom_r = 27;
        var zoom_padding = 10;
        var zoom_scale = 2;

        var width = image_ratio * columns * image_size + (columns - 1) * image_padding_columns;
        var image_group_height = rows * image_size + (rows - 1) * image_padding_rows
        var height = image_group_height + indicator_image_size + indicator_image_padding + indicator_box_top_padding;

        var indicator_data = [
            { x: 0, y: 0, id: 'Cityscapes', opacity: 1.0 },
            { x: 2 * indicator_image_size + indicator_image_padding, y: 0, id: 'BDD', opacity: 0.2 }
        ]

        var zoom_data = [
            { id: 'rn',cx: - (margin.left / 2), cy: image_size / 2, r: zoom_r },
            { id: 'baseline', cx: image_ratio * image_size * columns + image_padding_columns + margin.right / 2, cy: image_size / 2, r: zoom_r },
            { id: 'dr', cx: image_ratio * image_size * columns + image_padding_columns + margin.right / 2, cy: image_size / 2 + image_size + image_padding_rows, r: zoom_r }
        ]

        // 创建一个隐藏的Canvas元素
        var hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = zoom_r * 2;  // 设置Canvas的宽度和高度为缩放圆的直径
        hiddenCanvas.height = zoom_r * 2;
        var hiddenCtx = hiddenCanvas.getContext('2d');  // 获取Canvas的2D上下文

        var container = d3.select('#result_div')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('min-width', `${(width + margin.left + margin.right) / 2}px`)
            // .style('max-width', `${width + margin.left + margin.right}px`)
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

        var image_group = container
            .append('g')
            .attr('id', 'image_group')
            .attr('width', width)
            .attr('height', image_group_height)
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        var indicator_group = container
            .append('g')
            .attr('id', 'indicator_group')
            .attr('width', 2 * image_ratio * indicator_image_size + indicator_image_padding)
            .attr('height', indicator_image_size + indicator_image_padding + image_padding_rows)
            .attr('transform', `translate(${margin.left}, ${margin.top + image_group_height +
                image_padding_rows + indicator_box_top_padding})`);
        
        var button_group = container.append('g')
            .attr('id', 'button_group')
            .attr('width', button_width + 2 * button_padding)
            .attr('height', button_height + 2 * button_padding)
            .attr('transform', `translate(${width + margin.left - (button_width + button_padding)}, ${margin.top + image_group_height +
                image_padding_rows + indicator_box_top_padding})`);
        
        var zoom_group = container.append("g")
            .attr("id", "zoom_group")
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
        
        // 创建可见的放大镜圆圈
        var zoom_circle = zoom_group.selectAll('circle').data(zoom_data)
            .enter()
            .append('circle')
            .attr('id', function (d) { return d.id + 'circle' })
            .attr('r', function (d) { return d.r })
            .attr('cx', function (d) { return d.cx })
            .attr('cy', function (d) { return d.cy })
            .style('fill', 'none');

        // 创建clipPath
        zoom_data.forEach(function (d) {
            container.append("defs")
                .append("clipPath")
                .attr("id", "clip-" + d.id)
                .append("circle")
                .attr("cx", d.cx + margin.left)
                .attr("cy", d.cy + margin.top )
                .attr("r", d.r);
        });



        indicator_group
            .append('text')
            .attr('x', indicator_group.attr('width') / 2)
            .attr('y', -indicator_box_top_padding / 2)
            .attr('text-anchor', 'middle')
            .style('font-weight', 700)
            .style('font-size', '6px')
            .text('Click to select a different dataset:')
            .style("font-family", "sans-serif");


        var base_data_id = 'Cityscapes';
        var base_link = '/assets/img/de-rain_img/' + base_data_id + '/';
        var image_data = [
            {
                x: 0, y: 0, id: 'rn', link: base_link + 'rn0.png', title: 'Rainy Image'
            },
            {
                x: image_ratio * image_size + image_padding_columns, y: 0, id: 'baseline', link: base_link + 'baseline0.png', title: 'Baseline De-rained Result'
            },
            {
                x: 0, y: image_size + image_padding_rows, id: 'ref', link: base_link + 'ref0.png', title: 'Reference Image'
            },
            {
                x: image_ratio * image_size + image_padding_columns, y: image_size + image_padding_rows, id: 'dr', link: base_link + 'dr0.png', title: 'Pipeline De-rained Result'
            },
        ];
        var images = image_group.selectAll('image').data(image_data);



        images.enter()
            .append('svg:image')
            .attr('class', 'result_image')
            .attr('width', image_ratio * image_size)
            .attr('height', image_size)
            .attr('xlink:href', function (d) { return d.link; })
            .attr('id', function (d) { return d.id; })
            .attr('x', function (d) { return d.x; })
            .attr('y', function (d) { return d.y; })
            .on('mousemove', function (event, d) {
                // 判断鼠标当前位于哪一张图像上
                const imageID = d.id;

                // 如果鼠标在 rn, baseline, 或 dr 图像上
                if (['rn', 'baseline', 'dr'].includes(imageID)) {
                    // 获取鼠标在图像上的坐标
                    const [mx, my] = d3.pointer(event);

                    // 更新每一个 zoom circle
                    zoom_circle.each(function (zoomData) {
                        const matchedImageData = image_data.find(imgData => imgData.id === zoomData.id);
                        d3.select("#clip-" + zoomData.id).selectAll("image").remove();
                        const clipImage = d3.select("#clip-" + zoomData.id)
                            .append("image")
                            .attr("clip-path", "url(#clip-" + zoomData.id + ")")  // 添加这一行
                            .attr("xlink:href", matchedImageData.link)
                            .attr("x", zoomData.cx + margin.left - (mx * zoom_scale))
                            .attr("y", zoomData.cy + margin.top - (my * zoom_scale))
                            .attr("width", image_ratio * image_size * zoom_scale)
                            .attr('z', 1)
                            .attr("height", image_size * zoom_scale);
                    });
                }
            });


        image_group
            .selectAll('text')
            .data(image_data)
            .enter()
            .append('text')
            .attr('id', function (d) { return d.id + '_title' })
            .style("text-anchor", "middle")
            .style("font-weight", 700)
            .style("font-size", '6px')
            .text(function (d) { return d.title })
            .attr('x', function (d) { return (image_size) + d.x })
            .attr('y', function (d) { return -3 + d.y })
            .style("font-family", "sans-serif");

        function select_new_image(row, i) {
            const boundData = d3.select(this).data()[0];
            var rn_img = image_group.select('#rn');
            var baseline_img = image_group.select('#baseline');
            var dr_img = image_group.select('#dr');
            var ref_img = image_group.select('#ref');

            if (base_data_id == boundData.id) {
                return;
            }

            var indicator_images = indicator_group.selectAll('.indicator_image').data(indicator_data);
            indicator_images.attr('opacity', function (d) {
                if (boundData.id == d.id) {
                    return 1.0;
                } else {
                    return 0.2
                }
            })

            base_data_id = boundData.id;
            base_link = '/assets/img/de-rain_img/' + base_data_id + '/';

            cross_fade_image(rn_img, base_link + `rn0.png`, image_group, 500);
            cross_fade_image(baseline_img, base_link + `baseline0.png`, image_group, 500);
            cross_fade_image(dr_img, base_link + `dr0.png`, image_group, 500);
            cross_fade_image(ref_img, base_link + `ref0.png`, image_group, 500);
        }

        var indicator_images = indicator_group.selectAll('image').data(indicator_data);

        indicator_images.enter()
            .append('text')

        indicator_images.enter()
            .append('image')
            .attr('class', 'indicator_image')
            .attr('width', indicator_image_size * 2)
            .attr('height', indicator_image_size)
            .attr('xlink:href', function (d) {
                return '/assets/img/de-rain_img/' + d.id + '/dr0.png';
            })
            .attr('id', function (d) { return d.id; })
            .attr('x', function (d) { return d.x; })
            .attr('y', function (d) { return d.y; })
            .attr('opacity', function (d) { return d.opacity; })
            .on('click', select_new_image);
        
        var button_rect = button_group
            .append('rect')
            .attr('width', button_width)
            .attr('height', button_height)
            .attr('x', button_padding)
            .attr('y', button_padding)
            .style('fill', 'white')
            .style('stroke', 'gray')
            .style('stroke-width', 1);

        button_group
            .append('text')
            .attr('id', 'button_text')
            .style("text-anchor", "middle")
            .text('MORE RESULT')
            .style("text-anchor", "middle")
            .attr('x', button_padding + button_width / 2)  // 水平居中
            .attr('y', button_padding + button_height / 2 + 2.5)  // 垂直居中
            .style("font-weight", 600)
            .style("font-size", '7px')
            .style("font-family", "sans-serif");
        
        button_group
            .on("click", function () {
                const rn_img = image_group.select('#rn');
                const baseline_img = image_group.select('#baseline');
                const dr_img = image_group.select('#dr');
                const ref_img = image_group.select('#ref');
                const rn_href = rn_img.attr("xlink:href");
                const baseline_href = baseline_img.attr("xlink:href");
                const dr_href = dr_img.attr("xlink:href");
                const ref_href = ref_img.attr("xlink:href");

                let current_index = extractIndex(rn_href);

                if (current_index !== null) {
                    let new_index = current_index + 1;
                    let new_rn_href = rn_href.replace(`${current_index}.png`, `${new_index}.png`);
                    let new_baseline_href = baseline_href.replace(`${current_index}.png`, `${new_index}.png`);
                    let new_dr_href = dr_href.replace(`${current_index}.png`, `${new_index}.png`);
                    let new_ref_href = ref_href.replace(`${current_index}.png`, `${new_index}.png`);

                    imageExists(new_dr_href, function (exists) {
                        if (exists) {
                            cross_fade_image(rn_img, new_rn_href, image_group, 500);
                            cross_fade_image(baseline_img, new_baseline_href, image_group, 500);
                            cross_fade_image(dr_img, new_dr_href, image_group, 500);
                            cross_fade_image(ref_img, new_ref_href, image_group, 500);
                        } else {
                            // 如果新的图像不存在，将索引重置为0
                            new_index = 0;
                            let new_rn_href = rn_href.replace(`${current_index}.png`, `${new_index}.png`);
                            let new_baseline_href = baseline_href.replace(`${current_index}.png`, `${new_index}.png`);
                            let new_dr_href = dr_href.replace(`${current_index}.png`, `${new_index}.png`);
                            let new_ref_href = ref_href.replace(`${current_index}.png`, `${new_index}.png`);
                            cross_fade_image(rn_img, new_rn_href, image_group, 500);
                            cross_fade_image(baseline_img, new_baseline_href, image_group, 500);
                            cross_fade_image(dr_img, new_dr_href, image_group, 500);
                            cross_fade_image(ref_img, new_ref_href, image_group, 500);
                        }
                    });
                }
            })
            .on('mousedown', function () {
                d3.select(this).style("opacity", 0.2);
            })
            .on('mouseup', function () {
                d3.select(this).style("opacity", 1);
            })
    }
    de_rain_fig();
})();