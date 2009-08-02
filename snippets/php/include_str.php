<?php
// Returns the content of an include as a single-line string
function include_str($filename) {
    if (is_file($filename)) {
        ob_start();
        include $filename;
        $contents = ob_get_contents();
        ob_end_clean();
        return str_replace("\n", '', $contents);
    }
    return false;
}
?>